// Rate limit ringan (in-memory, per instance serverless) untuk /media-downloader.
// Meniru pola isRateLimited di app/api/cek-resi/route.ts.

import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestLog = new Map<string, { count: number; resetAt: number }>();

/**
 * Mengembalikan true jika IP sudah MELEWATI batas (10 request / 60 detik).
 * false jika masih dalam batas.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now > entry.resetAt) {
    requestLog.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/** Ambil IP klien dari header proxy (Vercel: x-forwarded-for). */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
