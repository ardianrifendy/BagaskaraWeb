// Provider fallback multi-platform via Cobalt (self-host / instance) — v10 API.
// Menggunakan sistem fallback otomatis ke beberapa mirror komunitas agar download YouTube lancar.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

// Daftar server Cobalt komunitas yang aktif dan tidak memblokir download YouTube.
const COBALT_MIRRORS = [
  "https://cobalt.kwi.cat",       // Prioritas 1: Ramah YouTube & sangat cepat
  "https://cobalt.q1w2.dev",      // Prioritas 2: Alternatif aktif
  "https://cobalt.moe",           // Prioritas 3: Alternatif aktif
  "https://api.cobalt.tools",     // Prioritas terakhir: Instance resmi (sering membatasi YouTube)
];

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
  text?: string; // Menyimpan pesan error jika status: "error"
}

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

// Lakukan fetch ke satu instance Cobalt spesifik.
// Melempar error jika HTTP gagal atau status respons adalah "error" (mis. diblokir/rate-limit).
async function fetchCobaltInstance(apiUrl: string, mediaUrl: string): Promise<CobaltResponse> {
  const apiKey = process.env.COBALT_API_KEY;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  // Kirim API Key hanya jika menembak URL kustom milik sendiri
  if (apiKey && apiUrl === process.env.COBALT_API_URL) {
    headers.Authorization = `Api-Key ${apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: mediaUrl }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} from ${apiUrl}`);
    }

    const payload = (await response.json()) as CobaltResponse;
    if (!payload || payload.status === "error") {
      throw new Error(payload?.text || `Cobalt instance ${apiUrl} returned error status`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

// Coba fetch ke custom API URL jika diset, jika gagal/kosong coba mirror komunitas secara berurutan.
async function fetchCobaltWithFallback(mediaUrl: string): Promise<CobaltResponse> {
  const customUrl = process.env.COBALT_API_URL?.trim();

  if (customUrl) {
    try {
      return await fetchCobaltInstance(customUrl, mediaUrl);
    } catch (err) {
      console.warn(`[cobalt] custom api failed: ${customUrl}, trying mirrors...`, err);
    }
  }

  let lastError: unknown = null;
  for (const mirror of COBALT_MIRRORS) {
    try {
      console.log(`[cobalt] trying mirror: ${mirror}`);
      const payload = await fetchCobaltInstance(mirror, mediaUrl);
      console.log(`[cobalt] success using mirror: ${mirror}`);
      return payload;
    } catch (err) {
      console.warn(`[cobalt] mirror failed: ${mirror}, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Semua server Cobalt gagal merespons.");
}

export const cobaltProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return (
      platform === "instagram" ||
      platform === "facebook" ||
      platform === "tiktok" ||
      platform === "youtube" ||
      platform === "pinterest" ||
      platform === "soundcloud" ||
      platform === "twitter" ||
      platform === "reddit"
    );
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    let payload: CobaltResponse;
    try {
      payload = await fetchCobaltWithFallback(url);
    } catch (err) {
      console.error("[cobalt] resolve error after all fallbacks", err);
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Terjadi kendala saat menghubungi server pengunduh. Silakan coba beberapa saat lagi."
      );
    }

    try {
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
