// Kontrak tipe untuk fitur /media-downloader.
// Dipakai bersama oleh provider, route handler, dan komponen UI.

export type Platform = "tiktok" | "instagram" | "facebook" | "youtube" | "pinterest" | "soundcloud" | "twitter" | "reddit" | "terabox";

export type MediaKind = "video" | "audio" | "image";

export interface MediaVariant {
  kind: MediaKind;
  label: string; // Bahasa Indonesia, mis. "Video Tanpa Watermark (HD)"
  url: string;
  ext: string;
  sizeBytes?: number;
}

export interface MediaResult {
  ok: true;
  platform: Platform;
  title?: string;
  author?: string;
  thumbnail?: string;
  durationSec?: number;
  variants: MediaVariant[];
}

// Kode error yang konsisten dengan pesan Bahasa Indonesia di route handler.
export type MediaErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "PRIVATE_OR_NOT_FOUND"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR";

export interface MediaErrorResult {
  ok: false;
  error: MediaErrorCode;
  message: string; // Bahasa Indonesia, ramah
}

export type MediaApiResponse = MediaResult | MediaErrorResult;

// Error terstruktur yang dilempar provider/registry, dipetakan ke MediaErrorCode oleh route.
export class MediaResolveError extends Error {
  code: MediaErrorCode;

  constructor(code: MediaErrorCode, message: string) {
    super(message);
    this.name = "MediaResolveError";
    this.code = code;
  }
}

export interface MediaProvider {
  supports(platform: Platform): boolean;
  // Menerima URL yang sudah dinormalisasi + platform hasil deteksi.
  resolve(url: string, platform: Platform): Promise<MediaResult>;
}
