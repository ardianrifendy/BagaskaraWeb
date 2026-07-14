import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { orderItems, statusLogs } from "@/database/schema-jastip";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateItemSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  variant: z.string().optional().nullable(),
  qty: z.coerce.number().int().positive("Kuantitas minimal 1").default(1),
  estPrice: z.coerce.number().nonnegative("Estimasi harga tidak boleh negatif"),
  actualPrice: z.coerce.number().nonnegative().optional().nullable(),
  weightGrams: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum([
    "requested",
    "hunting",
    "found",
    "purchased",
    "warehouse",
    "shipped",
    "out_of_stock",
    "cancelled",
  ]),
  substitutionOk: z.boolean(),
  proofUrl: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id);

  if (isNaN(itemId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = updateItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Fetch existing item to check status changes
    const oldItem = await dbJastip.query.orderItems.findFirst({
      where: eq(orderItems.id, itemId),
    });

    if (!oldItem) {
      return NextResponse.json({ ok: false, error: "Item tidak ditemukan." }, { status: 404 });
    }

    const [updatedItem] = await dbJastip
      .update(orderItems)
      .set({
        name: data.name,
        variant: data.variant || null,
        qty: data.qty,
        estPrice: data.estPrice.toString(),
        actualPrice: data.actualPrice !== undefined && data.actualPrice !== null ? data.actualPrice.toString() : null,
        weightGrams: data.weightGrams || null,
        status: data.status,
        substitutionOk: data.substitutionOk,
        proofUrl: data.proofUrl || null,
        note: data.note || null,
      })
      .where(eq(orderItems.id, itemId))
      .returning();

    // Log item status change if any
    if (oldItem.status !== data.status) {
      await dbJastip.insert(statusLogs).values({
        orderId: oldItem.orderId,
        itemId: itemId,
        field: "item_status",
        oldValue: oldItem.status,
        newValue: data.status,
      });
    }

    return NextResponse.json({ ok: true, item: updatedItem });
  } catch (error) {
    console.error("Gagal memperbarui item:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id);

  if (isNaN(itemId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const deleted = await dbJastip
      .delete(orderItems)
      .where(eq(orderItems.id, itemId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "Item tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Item berhasil dihapus." });
  } catch (error) {
    console.error("Gagal menghapus item:", error);
    return NextResponse.json({ ok: false, error: "Gagal menghapus data." }, { status: 500 });
  }
}
