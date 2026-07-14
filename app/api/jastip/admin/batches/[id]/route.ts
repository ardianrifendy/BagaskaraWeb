import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { batches } from "@/database/schema-jastip";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

const updateBatchSchema = z.object({
  slug: z.string().min(1, "Slug wajib diisi"),
  name: z.string().min(1, "Nama batch wajib diisi"),
  countryCode: z.string().min(2).max(5),
  currency: z.string().min(3).max(5),
  exchangeRate: z.coerce.number().positive("Kurs harus bernilai positif"),
  feeType: z.enum(["flat", "percent"]),
  feeValue: z.coerce.number().nonnegative("Nilai fee tidak boleh negatif"),
  orderDeadline: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
  status: z.enum(["open", "closed", "shipping", "done"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const batchId = parseInt(id);

  if (isNaN(batchId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = updateBatchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      slug,
      name,
      countryCode,
      currency,
      exchangeRate,
      feeType,
      feeValue,
      orderDeadline,
      eta,
      status,
    } = result.data;

    // Check unique slug on other batches
    const existing = await dbJastip.query.batches.findFirst({
      where: and(eq(batches.slug, slug), ne(batches.id, batchId)),
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Slug sudah digunakan oleh batch lain." },
        { status: 400 }
      );
    }

    const [updatedBatch] = await dbJastip
      .update(batches)
      .set({
        slug,
        name,
        countryCode,
        currency,
        exchangeRate: exchangeRate.toString(),
        feeType,
        feeValue: feeValue.toString(),
        orderDeadline: orderDeadline || null,
        eta: eta || null,
        status,
      })
      .where(eq(batches.id, batchId))
      .returning();

    if (!updatedBatch) {
      return NextResponse.json({ ok: false, error: "Batch tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, batch: updatedBatch });
  } catch (error) {
    console.error("Gagal memperbarui batch:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}
