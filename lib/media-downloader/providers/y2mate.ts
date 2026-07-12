// Provider fallback YouTube menggunakan API y2mate / yt2mp3.de.
// Sangat berguna untuk mem-bypass pembatasan video musik (VEVO) atau video yang memerlukan login.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

interface Yt2mp3Format {
  itag: number;
  kind: "video" | "audio";
  container: string;
  codec?: string;
  has_audio: boolean;
  width: number | null;
  height: number | null;
  fps?: number;
  bitrate: number | null;
  filesize: number | null;
  quality_label: string | null;
  download_hash: string | null;
  download_url: string | null;
}

interface Yt2mp3ApiResponse {
  video_id: string;
  title: string;
  duration: number;
  video_has_audio: boolean;
  formats?: Yt2mp3Format[];
  error?: string;
}

function extractYoutubeId(input: string): string | null {
  try {
    const parsed = new URL(input);
    if (parsed.hostname.includes("youtu.be")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] && /^[a-zA-Z0-9_-]{11}$/.test(parts[0])) {
        return parts[0];
      }
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) {
        return parts[1];
      }
    }
    const v = parsed.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
    }
  } catch {
    // ignore
  }
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\/\s]{11})/);
  return match ? match[1] : null;
}

export const y2mateProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "youtube";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    const videoId = extractYoutubeId(url);
    if (!videoId) {
      throw new MediaResolveError(
        "INVALID_URL",
        "Link YouTube tidak valid. Pastikan format link benar."
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiUrl = `https://yt2mp3.de/api.php?v=${videoId}`;
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP error status ${res.status}`);
      }

      const data = (await res.json()) as Yt2mp3ApiResponse;
      if (data.error) {
        throw new Error(data.error);
      }

      const formats = data.formats || [];
      if (formats.length === 0) {
        throw new MediaResolveError(
          "PRIVATE_OR_NOT_FOUND",
          "Video tidak ditemukan, bersifat privat, atau dibatasi oleh YouTube."
        );
      }

      const title = data.title || "Video YouTube";
      const durationSec = data.duration || undefined;
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const variants: MediaVariant[] = [];

      // 1. Ekstrak Audio (MP3/M4A)
      const audios = formats.filter((f) => f.kind === "audio");
      if (audios.length > 0) {
        // Urutkan berdasarkan bitrate menurun
        audios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        const bestAudio = audios[0];
        const bitrateKbps = bestAudio.bitrate ? Math.round(bestAudio.bitrate / 1000) : 128;
        const ext = bestAudio.container || "mp3";
        const urlDownload = bestAudio.download_url ||
          `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(bestAudio.download_hash || "")}`;

        variants.push({
          kind: "audio",
          label: `Audio MP3 (${bitrateKbps} kbps) - Kualitas Terbaik`,
          url: urlDownload,
          ext,
          sizeBytes: bestAudio.filesize || undefined,
        });

        // Tambah audio medium quality jika ada
        if (audios[1]) {
          const mediumAudio = audios[1];
          const medBitrate = mediumAudio.bitrate ? Math.round(mediumAudio.bitrate / 1000) : 128;
          const urlMedDownload = mediumAudio.download_url ||
            `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(mediumAudio.download_hash || "")}`;
          variants.push({
            kind: "audio",
            label: `Audio MP3 (${medBitrate} kbps)`,
            url: urlMedDownload,
            ext: mediumAudio.container || "mp3",
            sizeBytes: mediumAudio.filesize || undefined,
          });
        }
      }

      // 2. Ekstrak Video dengan Audio (MP4)
      const videosWithAudio = formats.filter((f) => f.kind === "video" && f.has_audio);
      if (videosWithAudio.length > 0) {
        // Urutkan berdasarkan resolusi (tinggi) menurun
        videosWithAudio.sort((a, b) => (b.height || 0) - (a.height || 0));

        videosWithAudio.forEach((f) => {
          const height = f.height || 360;
          const label = `Video MP4 ${height}p (Dengan Audio)`;
          const urlDownload = f.download_url ||
            `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(f.download_hash || "")}`;
          variants.push({
            kind: "video",
            label,
            url: urlDownload,
            ext: f.container || "mp4",
            sizeBytes: f.filesize || undefined,
          });
        });
      }

      // 3. Ekstrak Video Tanpa Audio (Resolusi tinggi seperti 1080p, 1440p, 2160p)
      const videosNoAudio = formats.filter((f) => f.kind === "video" && !f.has_audio);
      if (videosNoAudio.length > 0) {
        // Urutkan berdasarkan resolusi (tinggi) menurun
        videosNoAudio.sort((a, b) => (b.height || 0) - (a.height || 0));

        // Ambil maksimal 3 video tanpa audio teratas (mis. 1080p, 1440p, 2160p)
        videosNoAudio.slice(0, 3).forEach((f) => {
          const height = f.height || 720;
          const label = `Video MP4 ${height}p (Tanpa Audio)`;
          const urlDownload = f.download_url ||
            `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(f.download_hash || "")}`;
          variants.push({
            kind: "video",
            label,
            url: urlDownload,
            ext: f.container || "mp4",
            sizeBytes: f.filesize || undefined,
          });
        });
      }

      if (variants.length === 0) {
        throw new MediaResolveError(
          "PRIVATE_OR_NOT_FOUND",
          "Konten video tidak tersedia untuk diunduh."
        );
      }

      return {
        ok: true,
        platform,
        title,
        thumbnail,
        durationSec,
        variants,
      };
    } catch (err) {
      console.error("[y2mate] resolve error", err);
      if (err instanceof MediaResolveError) throw err;
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Gagal mengunduh video dari YouTube. Server pengunduh sedang sibuk atau diblokir."
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};
