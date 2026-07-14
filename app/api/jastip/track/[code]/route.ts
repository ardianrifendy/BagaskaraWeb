import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { orders } from "@/database/schema-jastip";
import { eq } from "drizzle-orm";
import { normalizeOrderCode } from "@/lib/jastip/order-code";

export const dynamic = "force-dynamic";

// In-memory rate limiting fallback
type RateLimitRecord = {
  count: number;
  resetTime: number;
};
const ipCache = new Map<string, RateLimitRecord>();

function isRateLimited(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = ipCache.get(ip);

  if (!record) {
    ipCache.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }

  record.count++;
  return record.count > limit;
}

// Masking helpers
function maskWaNumber(wa: string): string {
  let clean = wa.replace(/[^0-9]/g, "");
  if (clean.startsWith("62")) {
    clean = "0" + clean.substring(2);
  }
  if (clean.length >= 10) {
    const part1 = clean.substring(0, 4); // e.g. 0895
    const part2 = clean.substring(4, 6); // e.g. 13
    return `${part1}-${part2}XX-XXXX`;
  }
  return "08XX-XXXX-XXXX";
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return name;
  }
  return `${parts[0]} ${parts[1][0]}.`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limit check: 10 req/min
  if (isRateLimited(clientIp, 10, 60000)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Terlalu banyak permintaan. Silakan tunggu 1 menit sebelum mencoba lagi.",
      },
      { status: 429 }
    );
  }

  const { code } = await params;
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Kode order tidak boleh kosong." },
      { status: 400 }
    );
  }

  // Normalize code (e.g. jst-7kq2-m9xd -> JST-7KQ2-M9XD)
  const normalizedCode = normalizeOrderCode(code);

  try {
    console.time(`track-${normalizedCode}`);

    // Single query using Drizzle relational queries
    const orderData = await dbJastip.query.orders.findFirst({
      where: eq(orders.code, normalizedCode),
      with: {
        batch: true,
        items: true,
        payments: true,
      },
    });

    console.timeEnd(`track-${normalizedCode}`);

    if (!orderData) {
      return NextResponse.json(
        {
          ok: false,
          error: "Kode order tidak ditemukan. Cek lagi format kodenya atau hubungi admin.",
        },
        { status: 404 }
      );
    }

    // Mask data for public view
    const maskedOrder = {
      id: orderData.id,
      code: orderData.code,
      batch: orderData.batch,
      customerName: maskName(orderData.customerName),
      customerWaMasked: maskWaNumber(orderData.customerWa),
      paymentStatus: orderData.paymentStatus,
      notesPublic: orderData.notesPublic,
      resi: orderData.resi,
      courier: orderData.courier,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      // items (exclude sensitive internal fields if any, proofUrl and weight are public)
      items: orderData.items.map((item) => ({
        id: item.id,
        name: item.name,
        variant: item.variant,
        qty: item.qty,
        estPrice: item.estPrice,
        actualPrice: item.actualPrice,
        weightGrams: item.weightGrams,
        status: item.status,
        substitutionOk: item.substitutionOk,
        proofUrl: item.proofUrl,
        note: item.note,
        createdAt: item.createdAt,
      })),
      // payments (publicly show payments amounts and dates)
      payments: orderData.payments.map((pay) => ({
        id: pay.id,
        amountIdr: pay.amountIdr,
        type: pay.type,
        paidAt: pay.paidAt,
        note: pay.note,
      })),
    };

    const response = NextResponse.json({ ok: true, order: maskedOrder });
    // Caching 30 detik untuk endpoint track
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  } catch (error) {
    console.error("Gagal melakukan pelacakan order:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memproses pencarian di server." },
      { status: 500 }
    );
  }
}
