// Provider fallback multi-platform via Cobalt (self-host / instance) — v10 API.
// Hanya AKTIF bila COBALT_API_URL diset. Hanya me-resolve direct URL media.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

interface CobaltPickerItem {
  type?: string;
  url?: string;
  thumb?: string;
}

interface CobaltResponse {
  status?: "tunnel" | "redirect" | "picker" | "error" | "stream";
  url?: string;
  filename?: string;
  picker?: CobaltPickerItem[];
  audio?: string;
}

const DEFAULT_COBALT_URL = "https://api.cobalt.tools";

/** Selalu true karena menggunakan instance default jika env kosong. */
export function isCobaltEnabled(): boolean {
  return true;
}

// Ambil ekstensi file dari nama file, default "mp4".
function extFromFilename(filename: string | undefined, fallback: string): string {
  if (!filename) return fallback;
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return fallback;
  return filename.slice(dot + 1).toLowerCase();
}

async function fetchCobalt(url: string): Promise<CobaltResponse> {
  const apiUrl = (process.env.COBALT_API_URL || DEFAULT_COBALT_URL).trim();
  const apiKey = process.env.COBALT_API_KEY;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Api-Key ${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
      cache: "no-store",
      signal: controller.signal,
    });
    return (await response.json()) as CobaltResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export const cobaltProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "instagram" || platform === "facebook" || platform === "tiktok" || platform === "youtube";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    let payload: CobaltResponse;
    try {
      payload = await fetchCobalt(url);
    } catch {
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Terjadi kendala saat memproses link. Silakan coba beberapa saat lagi."
      );
    }

    try {
      if (!payload || payload.status === "error" || !payload.status) {
        throw new MediaResolveError(
          "PRIVATE_OR_NOT_FOUND",
          "Konten tidak ditemukan atau bersifat privat. Pastikan akun/video dapat diakses publik."
        );
      }

      const variants: MediaVariant[] = [];

      if (payload.status === "picker") {
        const items = Array.isArray(payload.picker) ? payload.picker : [];
        let photoCount = 0;
        items.forEach((item) => {
          if (!item.url) return;
          if (item.type === "video") {
            variants.push({
              kind: "video",
              label: "Video",
              url: item.url,
              ext: "mp4",
            });
          } else {
            photoCount += 1;
            variants.push({
              kind: "image",
              label: `Foto ${photoCount}`,
              url: item.url,
              ext: "jpg",
            });
          }
        });
        if (payload.audio) {
          variants.push({
            kind: "audio",
            label: "Audio (MP3)",
            url: payload.audio,
            ext: "mp3",
          });
        }
      } else {
        // tunnel | redirect | stream → satu variant video.
        if (payload.url) {
          variants.push({
            kind: "video",
            label: "Video",
            url: payload.url,
            ext: extFromFilename(payload.filename, "mp4"),
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
