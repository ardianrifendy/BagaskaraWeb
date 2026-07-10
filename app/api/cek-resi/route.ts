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
  awb: string,
  isText: boolean
): NextResponse {
  if (isText) {
    const courierLabel = courier ? courier.toUpperCase() : "LOGISTIK";
    const awbStr = awb || "-";
    const text = `❌ *PELACAKAN GAGAL*
----------------------------------------
*No. Resi:* ${awbStr} (${courierLabel})
*Pesan:* ${error}

Silakan cek kembali nomor resi dan kurir yang Anda masukkan.`;

    return new NextResponse(text, {
      status,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  return NextResponse.json(
    { ok: false, error, waFallbackMessage: buildWaFallbackMessage(courier, awb) },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courierParam = searchParams.get("courier")?.trim().toLowerCase() ?? "";
  const awbParam = searchParams.get("awb")?.trim() ?? "";
  const formatParam = searchParams.get("format")?.trim().toLowerCase() ?? "";
  const isText = formatParam === "text";

  if (!courierParam || !awbParam) {
    return errorResponse(400, "Kurir dan nomor resi wajib diisi.", courierParam, awbParam, isText);
  }

  if (!isSupportedCourier(courierParam)) {
    return errorResponse(400, "Kurir tidak didukung.", courierParam, awbParam, isText);
  }

  if (isRateLimited(getClientIp(request))) {
    return errorResponse(
      429,
      "Terlalu banyak percobaan, coba lagi sebentar lagi.",
      courierParam,
      awbParam,
      isText
    );
  }

  try {
    const result = await trackPackage(courierParam, awbParam);

    if (isText) {
      const courierLabel = result.summary.courier || courierParam.toUpperCase();
      const status = result.summary.status || "-";
      const receiverName = result.detail.receiver || result.summary.receiver || result.detail.shipper || "-";
      const receiverAddr = result.detail.destination || result.detail.origin || "-";
      
      let weightStr = "-";
      if (result.summary.weight) {
        const w = parseFloat(result.summary.weight.toString());
        if (!isNaN(w)) {
          if (w >= 100) {
            weightStr = `${w / 1000} Kg (${w} gram)`;
          } else {
            weightStr = `${w} Kg`;
          }
        }
      }
      const service = result.summary.service || "Regular";
      const lastDesc = result.summary.lastDesc || "-";

      const text = `📦 *STATUS PENGIRIMAN (${courierLabel})*
----------------------------------------
*No. Resi:* ${result.summary.awb}
*Status:* ${status}

*Penerima:* ${receiverName}
*Tujuan:* ${receiverAddr}
*Berat:* ${weightStr}
*Layanan:* ${service}

*Posisi Terakhir:*
"${lastDesc}"

🌐 *Lihat detail perjalanan lengkap:*
https://bagaskaracell.net/cek-resi?courier=${courierParam}&awb=${result.summary.awb}`;

      return new NextResponse(text, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

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
      return errorResponse(status, err.message, courierParam, awbParam, isText);
    }

    console.error("[api/cek-resi] unexpected error", err);
    return errorResponse(500, "Terjadi kesalahan, coba lagi nanti.", courierParam, awbParam, isText);
  }
}
