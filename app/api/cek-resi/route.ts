import { NextRequest, NextResponse } from "next/server";
import { BinderByteError, trackPackage } from "@/lib/binderbyte";
import { isSupportedCourier } from "@/lib/couriers";
import type { CekResiApiResponse } from "@/types/tracking";

export const dynamic = "force-dynamic";

// Rate limit ringan (in-memory, per instance)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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

function buildWaFallbackMessage(courier: string, awb: string): string {
  return `Halo, saya mau tanya status resi ${awb} kurir ${courier}`;
}

function errorResponse(
  status: number,
  error: string,
  courier: string,
  awb: string
): NextResponse<CekResiApiResponse> {
  return NextResponse.json(
    { ok: false, error, waFallbackMessage: buildWaFallbackMessage(courier, awb) },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courierParam = searchParams.get("courier")?.trim().toLowerCase() ?? "";
  const awbParam = searchParams.get("awb")?.trim() ?? "";

  if (!courierParam || !awbParam) {
    return errorResponse(400, "Kurir dan nomor resi wajib diisi.", courierParam, awbParam);
  }

  if (!isSupportedCourier(courierParam)) {
    return errorResponse(400, "Kurir tidak didukung.", courierParam, awbParam);
  }

  if (isRateLimited(getClientIp(request))) {
    return errorResponse(
      429,
      "Terlalu banyak percobaan, coba lagi sebentar lagi.",
      courierParam,
      awbParam
    );
  }

  try {
    const result = await trackPackage(courierParam, awbParam);
    const body: CekResiApiResponse = { ok: true, result };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof BinderByteError) {
      const status =
        err.reason === "invalid_input"
          ? 400
          : err.reason === "not_found"
            ? 404
            : 502;
      return errorResponse(status, err.message, courierParam, awbParam);
    }

    console.error("[api/cek-resi] unexpected error", err);
    return errorResponse(500, "Terjadi kesalahan, coba lagi nanti.", courierParam, awbParam);
  }
}
