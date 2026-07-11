import { NextRequest, NextResponse } from "next/server";
import { detectErrorCode, friendlyError } from "@/lib/smsProto";
import type { SmsProxyResponse } from "@/types/sms";

export const dynamic = "force-dynamic";

const UPSTREAM_URL = "https://litensi.id/api/sms/handler_api.php";
const REQUEST_TIMEOUT_MS = 12_000;

// Rate limit ringan (in-memory, per instance) — longgar karena polling 5 detik + auto-refresh 15 detik.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 40;

const requestLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(ip);
  if (!entry || now > entry.resetAt) {
    requestLog.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Whitelist parameter yang boleh di-forward ke upstream (selain action & api_key).
const FORWARDABLE_PARAMS = [
  "service",
  "country",
  "operator",
  "id",
  "status",
  "maxPrice",
  "fixedPrice",
  "phoneException",
  "start",
  "limit",
  "activationId",
  "forward",
  "ref",
] as const;

function jsonResponse<T>(payload: SmsProxyResponse<T>, status: number = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim() ?? "";

  if (!action) {
    return jsonResponse(
      { ok: false, action: "", error: "Parameter 'action' wajib diisi.", raw: "" },
      400
    );
  }

  if (isRateLimited(getClientIp(request))) {
    return jsonResponse(
      { ok: false, action, error: "Terlalu banyak request, tunggu sebentar.", raw: "" },
      429
    );
  }

  // Resolve API key: client override -> env
  const clientKey = searchParams.get("api_key")?.trim();
  const apiKey = (clientKey && clientKey.length > 0 ? clientKey : undefined) ?? process.env.SMS_ACTIVATION_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      { ok: false, action, error: "API Key litensi.id belum dimasukkan/dikonfigurasi.", raw: "" },
      400
    );
  }

  // Build upstream URL.
  const upstream = new URL(UPSTREAM_URL);
  upstream.searchParams.set("api_key", apiKey);
  upstream.searchParams.set("action", action);
  for (const key of FORWARDABLE_PARAMS) {
    const val = searchParams.get(key);
    if (val !== null && val.length > 0) upstream.searchParams.set(key, val);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let raw = "";
  let upstreamStatus = 0;
  try {
    const res = await fetch(upstream.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json, text/plain, */*" },
    });
    upstreamStatus = res.status;
    raw = await res.text();
    if (!res.ok) {
      return jsonResponse(
        {
          ok: false,
          action,
          error: `Provider merespon HTTP ${res.status}.`,
          raw,
          upstreamStatus,
        },
        502
      );
    }
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return jsonResponse(
      {
        ok: false,
        action,
        error: isAbort ? "Provider timeout (>12s)." : "Provider tidak dapat dihubungi.",
        raw: "",
      },
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  const errorCode = detectErrorCode(raw);
  if (errorCode) {
    return jsonResponse({
      ok: false,
      action,
      error: friendlyError(raw),
      raw,
      upstreamStatus,
    });
  }

  return jsonResponse({
    ok: true,
    action,
    data: raw,
    raw,
  });
}
