// Provider eksperimental TeraBox menggunakan API bypass publik gratisan.
// Karena ini menggunakan API pihak ketiga gratis, ketahanan layanannya bergantung pada API tersebut.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 20_000;

interface VercelTeraboxItem {
  name?: string;
  size?: string;
  thumb?: string;
  download?: string;
}

interface VercelTeraboxResponse {
  status?: string;
  data?: VercelTeraboxItem[];
}

interface VkrTeraboxItem {
  title?: string;
  thumb?: string;
  download_link?: string;
}

// Coba fetch primary API (Vercel)
async function fetchPrimary(url: string): Promise<VercelTeraboxResponse> {
  const endpoint = `https://terabox-downloader-five.vercel.app/api?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    return (await response.json()) as VercelTeraboxResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// Coba fetch secondary API (VKRDev)
async function fetchSecondary(url: string): Promise<VkrTeraboxItem[]> {
  const endpoint = `https://terabox-api.vkrdev.objectdata.in/api?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    return (await response.json()) as VkrTeraboxItem[];
  } finally {
    clearTimeout(timeout);
  }
}

export const teraboxProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "terabox";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    // 1. Coba API Utama (Vercel)
    try {
      const payload = await fetchPrimary(url);
      if (payload && payload.status === "success" && Array.isArray(payload.data) && payload.data.length > 0) {
        const variants: MediaVariant[] = [];
        payload.data.forEach((item) => {
          if (!item.download) return;
          const ext = item.name ? item.name.split(".").pop()?.toLowerCase() || "mp4" : "mp4";
          const isVideo = ["mp4", "mkv", "avi", "mov", "webm", "3gp"].includes(ext);

          variants.push({
            kind: isVideo ? "video" : "image",
            label: `Unduh File${item.size ? ` (${item.size})` : ""}`,
            url: item.download,
            ext,
          });
        });

        if (variants.length > 0) {
          const first = payload.data[0];
          return {
            ok: true,
            platform,
            title: first.name || "TeraBox File",
            thumbnail: first.thumb || undefined,
            variants,
          };
        }
      }
    } catch (err) {
      console.warn("[terabox] primary api failed, trying fallback...", err);
    }

    // 2. Coba API Fallback (VKRDev)
    try {
      const payload = await fetchSecondary(url);
      if (Array.isArray(payload) && payload.length > 0) {
        const variants: MediaVariant[] = [];
        payload.forEach((item) => {
          if (!item.download_link) return;
          const ext = item.title ? item.title.split(".").pop()?.toLowerCase() || "mp4" : "mp4";
          const isVideo = ["mp4", "mkv", "avi", "mov", "webm", "3gp"].includes(ext);

          variants.push({
            kind: isVideo ? "video" : "image",
            label: "Unduh File (VKR Fallback)",
            url: item.download_link,
            ext,
          });
        });

        if (variants.length > 0) {
          const first = payload[0];
          return {
            ok: true,
            platform,
            title: first.title || "TeraBox File",
            thumbnail: first.thumb || undefined,
            variants,
          };
        }
      }
    } catch (err) {
      console.warn("[terabox] secondary api failed...", err);
    }

    // Jika semua API gagal
    throw new MediaResolveError(
      "PROVIDER_ERROR",
      "Gagal mengambil link TeraBox. API bypass publik sedang offline atau limit, silakan coba lagi nanti."
    );
  },
};
