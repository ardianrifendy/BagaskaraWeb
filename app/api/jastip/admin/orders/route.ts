import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { orders } from "@/database/schema-jastip";
import { eq, and, lt, or, ilike, desc } from "drizzle-orm";
import { generateOrderCode } from "@/lib/jastip/order-code";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  batchId: z.coerce.number().positive("Batch ID wajib diisi"),
  customerName: z.string().min(1, "Nama pelanggan wajib diisi"),
  customerWa: z.string().min(6, "Nomor WhatsApp tidak valid"),
  paymentStatus: z.enum(["unpaid", "dp", "paid"]).default("unpaid"),
  notesPublic: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  resi: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const batchId = searchParams.get("batchId");
  const paymentStatus = searchParams.get("paymentStatus");
  const cursorParam = searchParams.get("cursor");

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(orders.code, `%${q}%`),
        ilike(orders.customerName, `%${q}%`)
      )
    );
  }

  if (batchId) {
    const bId = parseInt(batchId);
    if (!isNaN(bId)) {
      conditions.push(eq(orders.batchId, bId));
    }
  }

  if (paymentStatus) {
    conditions.push(eq(orders.paymentStatus, paymentStatus));
  }

  if (cursorParam) {
    const cursor = parseInt(cursorParam);
    if (!isNaN(cursor)) {
      conditions.push(lt(orders.id, cursor));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const limit = 20;
    // Ambil limit + 1 untuk mengecek apakah ada halaman berikutnya
    const fetchedOrders = await dbJastip.query.orders.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(orders.id)],
      with: {
        batch: true,
        items: true,
      },
    });

    const hasNextPage = fetchedOrders.length > limit;
    const items = hasNextPage ? fetchedOrders.slice(0, limit) : fetchedOrders;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      orders: items,
      nextCursor,
      hasNextPage,
    });
  } catch (error) {
    console.error("Gagal mengambil daftar orders:", error);
    return NextResponse.json({ ok: false, error: "Gagal mengambil data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Retry collision check up to 3 times
    let code = "";
    let isUnique = false;
    let retries = 0;

    while (!isUnique && retries < 3) {
      code = generateOrderCode();
      const existing = await dbJastip.query.orders.findFirst({
        where: eq(orders.code, code),
      });

      if (!existing) {
        isUnique = true;
      } else {
        retries++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { ok: false, error: "Gagal menghasilkan kode order unik setelah beberapa percobaan." },
        { status: 500 }
      );
    }

    const [newOrder] = await dbJastip.insert(orders).values({
      code,
      batchId: data.batchId,
      customerName: data.customerName,
      customerWa: data.customerWa,
      paymentStatus: data.paymentStatus,
      notesPublic: data.notesPublic || null,
      notesInternal: data.notesInternal || null,
      resi: data.resi || null,
      courier: data.courier || null,
    }).returning();

    return NextResponse.json({ ok: true, order: newOrder });
  } catch (error) {
    console.error("Gagal membuat order baru:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}
