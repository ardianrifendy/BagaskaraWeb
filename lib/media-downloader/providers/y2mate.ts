// Provider fallback YouTube menggunakan API y2mate.com.
// Sangat berguna untuk mem-bypass pembatasan video musik (VEVO) atau video yang memerlukan login.

import {
  MediaResolveError,
  type MediaProvider,
  type MediaResult,
  type MediaVariant,
  type Platform,
} from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

interface Y2mateAnalyzeResponse {
  status: string;
  mess?: string;
  result: string; // Berisi HTML string
}

interface Y2mateDownloadResponse {
  status: string;
  mess?: string;
  dlink?: string; // Tautan download langsung
}

export const y2mateProvider: MediaProvider = {
  supports(platform: Platform): boolean {
    return platform === "youtube";
  },

  async resolve(url: string, platform: Platform): Promise<MediaResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Step 1: Analisis URL video
      const analyzeRes = await fetch("https://www.y2mate.com/features/ajax/analyze/ajax", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "*/*",
        },
        body: `url=${encodeURIComponent(url)}&q_auto=0&ajax=1`,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!analyzeRes.ok) {
        throw new Error(`Analyze HTTP error ${analyzeRes.status}`);
      }

      const analyzeJson = (await analyzeRes.json()) as Y2mateAnalyzeResponse;
      if (analyzeJson.status !== "success" || !analyzeJson.result) {
        throw new Error(analyzeJson.mess || "Gagal menganalisis link y2mate.");
      }

      const html = analyzeJson.result;

      // Ekstrak video ID (_id)
      const idMatch = html.match(/var\s+_id\s*=\s*['"]([^'"]+)['"]/);
      const vid = idMatch ? idMatch[1] : null;

      // Ekstrak token download pertama (k__id)
      const kIdMatch = html.match(
        /ajax_download\(['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]/
      );
      const kId = kIdMatch ? kIdMatch[1] : null;

      // Ekstrak judul video dari HTML (dalam tag <b>)
      const titleMatch = html.match(/<div\s+class="caption[^"]*">.*?<b>(.*?)<\/b>/s);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      if (!vid || !kId) {
        throw new Error("Gagal mengurai token download dari y2mate.");
      }

      // Step 2: Request Link Download
      const downloadRes = await fetch("https://www.y2mate.com/features/ajax/download/ajax", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "*/*",
        },
        body: `vid=${encodeURIComponent(vid)}&k_type=youtube&k_id=${encodeURIComponent(kId)}`,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!downloadRes.ok) {
        throw new Error(`Download HTTP error ${downloadRes.status}`);
      }

      const downloadJson = (await downloadRes.json()) as Y2mateDownloadResponse;
      if (downloadJson.status !== "success" || !downloadJson.dlink) {
        throw new Error(downloadJson.mess || "Gagal membuat link download y2mate.");
      }

      const variants: MediaVariant[] = [
        {
          kind: "video",
          label: "Video (Bypass VEVO/Musik)",
          url: downloadJson.dlink,
          ext: "mp4",
        },
      ];

      return {
        ok: true,
        platform,
        title,
        variants,
      };
    } catch (err) {
      console.error("[y2mate] resolve error", err);
      throw new MediaResolveError(
        "PROVIDER_ERROR",
        "Gagal meresolusi link YouTube via y2mate. Tautan mungkin tidak valid atau diblokir."
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};
