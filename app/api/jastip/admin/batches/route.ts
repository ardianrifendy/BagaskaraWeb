import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { batches } from "@/database/schema-jastip";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBatchSchema = z.object({
  slug: z.string().min(1, "Slug wajib diisi"),
  name: z.string().min(1, "Nama batch wajib diisi"),
  countryCode: z.string().min(2).max(5),
  currency: z.string().min(3).max(5),
  exchangeRate: z.coerce.number().positive("Kurs harus bernilai positif"),
  feeType: z.enum(["flat", "percent"]),
  feeValue: z.coerce.number().nonnegative("Nilai fee tidak boleh negatif"),
  orderDeadline: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
  status: z.enum(["open", "closed", "shipping", "done"]).default("open"),
});

export async function GET() {
  try {
    const allBatches = await dbJastip.query.batches.findMany({
      orderBy: [desc(batches.createdAt)],
    });
    return NextResponse.json({ ok: true, batches: allBatches });
  } catch (error) {
    console.error("Gagal mengambil data batches:", error);
    return NextResponse.json({ ok: false, error: "Gagal mengambil data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createBatchSchema.safeParse(body);

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

    // Check unique slug
    const existing = await dbJastip.query.batches.findFirst({
      where: (batches, { eq }) => eq(batches.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Slug sudah digunakan oleh batch lain." },
        { status: 400 }
      );
    }

    const [newBatch] = await dbJastip.insert(batches).values({
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
    }).returning();

    return NextResponse.json({ ok: true, batch: newBatch });
  } catch (error) {
    console.error("Gagal membuat batch baru:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}
