// Registry provider untuk /media-downloader.
// Menentukan provider mana yang dipakai per platform + fallback Cobalt.

import { normalizeUrl } from "../detect";
import { MediaResolveError, type MediaResult } from "../types";
import { cobaltProvider, isCobaltEnabled } from "./cobalt";
import { tikwmProvider } from "./tikwm";
import { teraboxProvider } from "./terabox";
import { y2mateProvider } from "./y2mate";

/**
 * Resolusi utama: dari URL mentah user menjadi MediaResult (kumpulan direct URL).
 * Melempar MediaResolveError terstruktur bila gagal.
 */
export async function resolveMedia(rawUrl: string): Promise<MediaResult> {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    throw new MediaResolveError(
      "INVALID_URL",
      "Link tidak valid. Pastikan Anda menyalin link lengkap dari aplikasi."
    );
  }

  const { url, platform } = normalized;

  if (platform === "terabox") {
    return await teraboxProvider.resolve(url, platform);
  }

  if (platform === "youtube") {
    try {
      return await cobaltProvider.resolve(url, platform);
    } catch (err) {
      console.warn("[index] cobalt failed for youtube, trying y2mate fallback...", err);
      try {
        return await y2mateProvider.resolve(url, platform);
      } catch (y2mateErr) {
        console.error("[index] y2mate fallback also failed:", y2mateErr);
        throw y2mateErr;
      }
    }
  }

  if (platform === "tiktok") {
    try {
      return await tikwmProvider.resolve(url, platform);
    } catch (err) {
      // Fallback ke Cobalt bila tersedia; jika fallback juga gagal, lempar error tikwm asli.
      if (err instanceof MediaResolveError && isCobaltEnabled()) {
        try {
          return await cobaltProvider.resolve(url, platform);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  }

  // youtube / instagram / facebook → hanya lewat Cobalt.
  if (isCobaltEnabled()) {
    return await cobaltProvider.resolve(url, platform);
  }

  throw new MediaResolveError(
    "UNSUPPORTED_PLATFORM",
    "Platform ini belum didukung. Saat ini kami mendukung TikTok. Instagram dan Facebook akan segera hadir."
  );
}
