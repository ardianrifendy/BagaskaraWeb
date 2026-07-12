// Provider TikTok via tikwm.com (tanpa API key).
// Hanya me-resolve direct URL media; TIDAK mem-proxy/stream file.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const TIKWM_ENDPOINT = "https://www.tikwm.com/api/";
const REQUEST_TIMEOUT_MS = 15_000;

interface TikwmAuthor {
  unique_id?: string;
  nickname?: string;
}

interface TikwmData {
  id?: string;
  title?: string;
  play?: string;
  hdplay?: string;
  wmplay?: string;
  music?: string;
  duration?: number;
  author?: TikwmAuthor;
  cover?: string;
  images?: string[];
}

interface TikwmResponse {
  code?: number;
  msg?: string;
  data?: TikwmData;
}

async function fetchTikwm(url: string): Promise<TikwmResponse> {
  const endpoint = `${TIKWM_ENDPOINT}?url=${encodeURIComponent(url)}&hd=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    return (await response.json()) as TikwmResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// Coba fetch dengan 1x retry bila fetch/timeout gagal.
async function fetchWithRetry(url: string): Promise<TikwmResponse> {
  try {
    return await fetchTikwm(url);
  } catch {
    return await fetchTikwm(url);
  }
}

export const tikwmProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "tiktok";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    let payload: TikwmResponse;
    try {
      payload = await fetchWithRetry(url);
    } catch {
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Terjadi kendala saat memproses link. Silakan coba beberapa saat lagi."
      );
    }

    if (!payload || payload.code !== 0 || !payload.data) {
      throw new MediaResolveError(
        "PRIVATE_OR_NOT_FOUND",
        "Konten tidak ditemukan atau bersifat privat. Pastikan akun/video dapat diakses publik."
      );
    }

    try {
      const data = payload.data;
      const variants: MediaVariant[] = [];

      const uniqueId = data.author?.unique_id?.trim();
      const author = uniqueId ? `@${uniqueId}` : data.author?.nickname;

      if (Array.isArray(data.images) && data.images.length > 0) {
        // Slide foto.
        data.images.forEach((imageUrl, index) => {
          if (imageUrl) {
            variants.push({
              kind: "image",
              label: `Foto ${index + 1}`,
              url: imageUrl,
              ext: "jpg",
            });
          }
        });
        if (data.music) {
          variants.push({
            kind: "audio",
            label: "Audio (MP3)",
            url: data.music,
            ext: "mp3",
          });
        }
      } else {
        // Video.
        const noWatermark = data.hdplay || data.play;
        if (noWatermark) {
          variants.push({
            kind: "video",
            label: "Video Tanpa Watermark (HD)",
            url: noWatermark,
            ext: "mp4",
          });
        }
        if (data.wmplay) {
          variants.push({
            kind: "video",
            label: "Video Dengan Watermark",
            url: data.wmplay,
            ext: "mp4",
          });
        }
        if (data.music) {
          variants.push({
            kind: "audio",
            label: "Audio (MP3)",
            url: data.music,
            ext: "mp3",
          });
        }
      }

      if (variants.length === 0) {
        throw new MediaResolveError(
          "PRIVATE_OR_NOT_FOUND",
          "Konten tidak ditemukan atau bersifat privat. Pastikan akun/video dapat diakses publik."
        );
      }

      return {
        ok: true,
        platform,
        title: data.title || undefined,
        author: author || undefined,
        thumbnail: data.cover || undefined,
        durationSec: typeof data.duration === "number" ? data.duration : undefined,
        variants,
      };
    } catch (err) {
      if (err instanceof MediaResolveError) throw err;
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Terjadi kendala saat memproses link. Silakan coba beberapa saat lagi."
      );
    }
  },
};
