import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { payments } from "@/database/schema-jastip";
import { z } from "zod";

const createPaymentSchema = z.object({
  orderId: z.coerce.number().positive("Order ID wajib diisi"),
  amountIdr: z.coerce.number().positive("Jumlah nominal harus positif"),
  type: z.enum(["dp", "pelunasan", "refund"]),
  paidAt: z.string().min(1, "Tanggal pembayaran wajib diisi"),
  note: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const [newPayment] = await dbJastip
      .insert(payments)
      .values({
        orderId: data.orderId,
        amountIdr: data.amountIdr.toString(),
        type: data.type,
        paidAt: data.paidAt,
        note: data.note || null,
      })
      .returning();

    return NextResponse.json({ ok: true, payment: newPayment });
  } catch (error) {
    console.error("Gagal menambahkan pembayaran:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}
