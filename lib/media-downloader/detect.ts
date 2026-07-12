// Deteksi platform & validasi URL untuk /media-downloader.
// Proteksi anti-SSRF: hanya hostname whitelist yang diterima; selain itu ditolak.

import type { Platform } from "./types";

// Whitelist hostname per platform (implementation.md 4.1).
const PLATFORM_HOSTS: Record<Platform, string[]> = {
  tiktok: ["tiktok.com", "www.tiktok.com", "vt.tiktok.com", "vm.tiktok.com", "m.tiktok.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"],
  pinterest: ["pinterest.com", "www.pinterest.com", "pin.it"],
  soundcloud: ["soundcloud.com", "m.soundcloud.com"],
  twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
  reddit: ["reddit.com", "www.reddit.com", "old.reddit.com"],
};

// Hostname yang mengarah ke jaringan internal / loopback — selalu tolak (anti-SSRF).
function isInternalHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  // IPv4 privat / loopback / link-local
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  return false;
}

// Cocokkan host ke platform berdasar whitelist (match persis atau subdomain resmi).
function matchPlatform(host: string): Platform | null {
  const h = host.toLowerCase();
  for (const platform of Object.keys(PLATFORM_HOSTS) as Platform[]) {
    for (const allowed of PLATFORM_HOSTS[platform]) {
      if (h === allowed || h.endsWith("." + allowed)) {
        return platform;
      }
    }
  }
  return null;
}

/**
 * Deteksi platform dari URL. Mengembalikan null jika:
 * - URL tidak valid / bukan http(s)
 * - host internal (SSRF)
 * - host tidak ada di whitelist platform mana pun
 */
export function detectPlatform(rawUrl: string): Platform | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  const host = parsed.hostname;
  if (!host || isInternalHost(host)) {
    return null;
  }

  return matchPlatform(host);
}

/**
 * Validasi & normalisasi URL user menjadi bentuk aman untuk diteruskan ke provider.
 * Mengembalikan null jika URL tidak lolos deteksi platform (anti-SSRF).
 */
export function normalizeUrl(rawUrl: string): { url: string; platform: Platform } | null {
  const platform = detectPlatform(rawUrl);
  if (!platform) return null;

  const parsed = new URL(rawUrl.trim());
  // Paksa https, buang fragment; simpan query (dibutuhkan sebagian link).
  parsed.protocol = "https:";
  parsed.hash = "";

  return { url: parsed.toString(), platform };
}

/**
 * Validasi hostname hasil redirect shortlink. Dipakai provider setelah follow redirect
 * (mis. vt.tiktok.com → tiktok.com) untuk memastikan host akhir tetap di whitelist.
 */
export function isAllowedHost(host: string): boolean {
  if (isInternalHost(host)) return false;
  return matchPlatform(host) !== null;
}

export { PLATFORM_HOSTS };
