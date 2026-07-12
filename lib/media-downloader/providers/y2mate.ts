// Provider fallback YouTube menggunakan serverless Python yt-dlp pada Vercel.
// Sangat handal karena yt-dlp diupdate berkala dan mem-bypass pembatasan video musik (VEVO).

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 25_000; // Berikan waktu ekstra untuk yt-dlp ekstraksi

export const y2mateProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "youtube";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Dapatkan base URL vercel
    const host = process.env.VERCEL_URL || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const apiUrl = `${protocol}://${host}/api/ytdl`;

    console.log(`[ytdl-provider] calling: ${apiUrl} for ${url}`);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `HTTP error status ${res.status}`);
      }

      const data = (await res.json()) as MediaResult;
      if (!data || !data.ok) {
        throw new Error("Invalid response payload from python backend");
      }

      return data;
    } catch (err) {
      console.error("[ytdl-provider] resolve error", err);
      if (err instanceof MediaResolveError) throw err;
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Gagal memproses video YouTube. Silakan coba beberapa saat lagi."
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};
