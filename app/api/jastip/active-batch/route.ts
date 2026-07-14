import { dbJastip } from "@/lib/db-jastip";
import { batches } from "@/database/schema-jastip";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeBatch = await dbJastip.query.batches.findFirst({
      where: eq(batches.status, "open"),
      orderBy: [desc(batches.createdAt)],
    });

    const response = NextResponse.json({ ok: true, batch: activeBatch || null });
    // Cache 1 jam
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return response;
  } catch (error) {
    console.error("Gagal mengambil data batch aktif:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mengambil data dari server." },
      { status: 500 }
    );
  }
}
