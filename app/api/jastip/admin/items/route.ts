import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { orderItems } from "@/database/schema-jastip";
import { z } from "zod";

const createItemSchema = z.object({
  orderId: z.coerce.number().positive("Order ID wajib diisi"),
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
  ]).default("requested"),
  substitutionOk: z.boolean().default(false),
  proofUrl: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const [newItem] = await dbJastip
      .insert(orderItems)
      .values({
        orderId: data.orderId,
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
      .returning();

    return NextResponse.json({ ok: true, item: newItem });
  } catch (error) {
    console.error("Gagal menambahkan item:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}
