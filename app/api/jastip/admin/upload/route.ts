import { put } from "@vercel/blob";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "File tidak ditemukan." }, { status: 400 });
    }

    // Validasi ukuran: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Ukuran file melebihi batas 2MB." },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: "Format file harus berupa JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Upload ke Vercel Blob
    // Nama file disanitasi agar tidak ada karakter aneh
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blob = await put(`jastip/proofs/${Date.now()}-${safeName}`, file, {
      access: "public",
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Gagal mengunggah file:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mengunggah file ke storage server." },
      { status: 500 }
    );
  }
}
