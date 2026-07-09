# AGENTS.md — Bagaskara Cell Catalog

Instruksi untuk AI coding agents (Claude Code, Copilot, Cursor, Codex, dll) yang bekerja di repository ini.

## Ringkasan Project

Katalog HP mobile-first untuk toko retail Bagaskara Cell. Customer memfilter stok berdasarkan **budget**, melihat spesifikasi, lalu menghubungi owner via **tombol WhatsApp pre-filled**. Bukan e-commerce — tidak ada checkout/pembayaran.

- Framework: **Next.js (App Router) + TypeScript + Tailwind CSS**
- Deploy: **Vercel**
- Data Fase 1: `data/products.json` (belum ada database)
- Dokumen acuan: `IMPLEMENTATION.md` (roadmap & fase), `CLAUDE.md` (konvensi detail)

## Setup & Perintah

```bash
npm install          # install dependencies
npm run dev          # dev server di localhost:3000
npm run build        # production build
npm run lint         # eslint
npx tsc --noEmit     # type check
```

## Aturan Wajib untuk Agent

### Sebelum coding
- Baca `IMPLEMENTATION.md` dan pastikan task yang diminta sesuai **fase aktif**. Jangan mengerjakan fitur Fase 2/3 (database, admin, compare) saat project masih Fase 1, kecuali diminta eksplisit.
- **Ikuti Pipeline Pengerjaan (`IMPLEMENTATION.md` §5) secara berurutan**: Step 0 Foundation → Step 1 Kontrak Data → Step 2 Utility → Step 3 Komponen → Step 4 Landing → Step 5 Detail → Step 6 Responsive → Step 7 SEO/Deploy → Step 8 UAT. Jangan memulai step baru sebelum exit criteria step sebelumnya terpenuhi.
- Jangan menambah scope. Jika task ambigu, pilih interpretasi paling sederhana yang memenuhi kebutuhan.

### Saat coding
- TypeScript **strict**; hindari `any`. Tipe produk di `types/product.ts` adalah source of truth — harga & stok ada di level **varian**.
- Server Components default; `"use client"` hanya untuk komponen interaktif.
- State filter/search/sort → **URL query params** (`?budget=`, `?brand=`, `?q=`, `?sort=`). Semua tampilan harus bisa di-share sebagai link.
- Gambar produk **wajib** `next/image`.
- Konfigurasi toko (nomor WA, nama, alamat) hanya dari `config/site.ts` — jangan hardcode di komponen.
- UI berbahasa **Indonesia**, mobile-first (uji di 375px), styling Tailwind saja.
- Jangan menambah dependency baru tanpa kebutuhan jelas. Jangan menambah UI library / state management library.

### Sebelum menyelesaikan task
- `npm run build` dan `npx tsc --noEmit` harus lolos tanpa error.
- `npm run lint` bersih.
- Layout diverifikasi di viewport mobile.
- Tidak ada file sensitif ikut ter-commit (`.env`, kredensial, `node_modules`).

## Struktur Direktori

```
app/            # routes (App Router)
components/     # komponen React, PascalCase
data/           # products.json (Fase 1)
types/          # TypeScript interfaces
lib/            # util: formatRupiah, buildWaLink, filterProducts
config/         # site.ts — identitas toko
public/images/  # foto produk
```

## Pola Penting

- **Link WhatsApp:** `https://wa.me/{nomor}?text={encodeURIComponent(pesan)}`; pesan menyertakan nama produk, varian, dan harga. Gunakan util `buildWaLink()`.
- **Format harga:** `Rp 1.999.000` via `formatRupiah()`.
- **Filter dinamis:** opsi filter (merk, RAM) di-generate dari isi data, bukan daftar hardcode.
- **Empty state:** selalu tampilkan produk range harga terdekat + tombol "Tanya stok via WA".

## Keamanan & Batasan

- Jangan pernah commit kredensial, token, atau `.env`.
- Jangan menjalankan perintah destruktif (hapus data, force push) tanpa konfirmasi eksplisit dari owner.
- Fase 2 (admin panel): route `/admin` wajib protected; jangan mengekspos endpoint tulis tanpa auth.
- Foto unit second adalah aset penting — jangan menghapus/menimpa file di `public/images/` tanpa diminta.

## Testing

Belum ada test suite formal di Fase 1. Validasi = build lolos + type check bersih + verifikasi manual mobile viewport. Jika menambah util di `lib/`, unit test sederhana (Vitest) dipersilakan tapi tidak wajib.
