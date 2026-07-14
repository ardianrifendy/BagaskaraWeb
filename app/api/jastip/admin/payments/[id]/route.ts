import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { payments } from "@/database/schema-jastip";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paymentId = parseInt(id);

  if (isNaN(paymentId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const deleted = await dbJastip
      .delete(payments)
      .where(eq(payments.id, paymentId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Data pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Pembayaran berhasil dihapus." });
  } catch (error) {
    console.error("Gagal menghapus pembayaran:", error);
    return NextResponse.json({ ok: false, error: "Gagal menghapus data." }, { status: 500 });
  }
}
