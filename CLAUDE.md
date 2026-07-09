# CLAUDE.md — Bagaskara Cell Catalog

Konteks project untuk Claude Code. Baca file ini sebelum mengerjakan task apapun.

## Tentang Project

Website **katalog HP mobile-first** untuk Bagaskara Cell (toko HP di Gresik, jualan offline + Shopee/Tokopedia/TikTok Shop).

**Tujuan bisnis:** customer self-service cari HP sesuai budget → lihat spek sendiri → klik tombol WhatsApp yang sudah pre-filled. Owner berhenti bikin list stok manual di chat.

**PENTING — batasan scope:**
- Ini **BUKAN e-commerce**. Tidak ada cart, checkout, pembayaran, atau akun user.
- Konversi = klik tombol WhatsApp. Semua fitur diukur dari situ.
- Jangan menambah fitur di luar fase yang sedang dikerjakan (lihat `IMPLEMENTATION.md`).

## Tech Stack

- **Next.js 14+ App Router** — bukan Pages Router
- **TypeScript strict** — semua file `.tsx`/`.ts`, hindari `any`
- **Tailwind CSS** — utility class, jangan bikin file CSS terpisah kecuali terpaksa
- **Data Fase 1:** `data/products.json` — jangan setup database sebelum Fase 2
- **Deploy:** Vercel

## Perintah

```bash
npm run dev          # dev server
npm run build        # production build — WAJIB lolos sebelum selesai task
npm run lint         # eslint
npx tsc --noEmit     # type check
```

## Konvensi Kode

- Komponen: `components/` — PascalCase, satu komponen per file
- Server Components by default; `"use client"` hanya jika butuh interaktivitas (filter, swatch, compare bar)
- State filter/search/sort disimpan di **URL query params** (pakai `useSearchParams` / `router.push`), bukan hanya state lokal — semua tampilan harus shareable via link
- Semua gambar produk lewat **`next/image`** — tanpa pengecualian
- Format harga: Rupiah dengan pemisah titik → `Rp 1.999.000` (bikin util `formatRupiah()`)
- Tipe data produk ada di `types/product.ts` — harga & stok hidup di level **varian**, bukan produk
- Link WA: `https://wa.me/{nomor}?text={encodeURIComponent(pesan)}` — pesan selalu menyertakan nama produk + varian + harga
- Bahasa UI: **Bahasa Indonesia** casual-sopan (target: customer retail Gresik)

## Prinsip UI/UX (Jangan Dilanggar)

1. **Mobile-first.** Cek semua layout di viewport 375px dulu, baru desktop.
2. **Tidak ada popup/wizard yang menghalangi katalog.** Budget picker = section di landing, bukan gate.
3. Filter = chip horizontal scrollable; filter lanjutan = bottom sheet. **Bukan sidebar.**
4. Desain clean: putih dominan + satu warna aksen. Foto produk adalah bintang; jangan bikin UI ramai.
5. Empty state wajib punya fallback (produk range terdekat + tombol WA), jangan hanya "tidak ada produk".
6. Filter merk/RAM di-generate dari data — jangan hardcode daftar merk.

## Yang TIDAK Boleh Dilakukan

- ❌ Menambah dependency berat tanpa alasan kuat (UI library besar, state management library) — Tailwind + React hooks cukup
- ❌ Setup database/auth/admin panel saat masih Fase 1
- ❌ Hardcode nomor WA / nama toko di banyak tempat — pusatkan di `config/site.ts`
- ❌ Menghapus atau mengubah struktur `products.json` tanpa update `types/product.ts`
- ❌ Commit `node_modules`, `.env`, atau file build

## Struktur Project

```
app/
├── page.tsx                  # Landing: hero → budget picker → katalog
├── produk/[slug]/page.tsx    # Detail produk
└── compare/page.tsx          # Fase 3
components/
├── ProductCard.tsx
├── BudgetPicker.tsx
├── FilterChips.tsx
├── SpecHighlights.tsx
└── WhatsAppButton.tsx
data/products.json             # sumber data Fase 1
types/product.ts
lib/                           # formatRupiah, buildWaLink, filterProducts
config/site.ts                 # nomor WA, nama toko, alamat, link Maps
```

## Alur Kerja Task

1. Baca `IMPLEMENTATION.md` → pastikan task masuk fase yang benar
2. **Ikuti Pipeline Pengerjaan (`IMPLEMENTATION.md` §5) secara berurutan** — jangan mengerjakan Step N sebelum exit criteria Step N-1 terpenuhi. Contoh: jangan bikin komponen sebelum `types/product.ts` dan util di `lib/` selesai.
3. Kerjakan → jalankan `npm run build` + `npx tsc --noEmit` sampai bersih
4. Test manual di viewport mobile (375px), lalu cek 768px & 1280px (tabel responsive di `IMPLEMENTATION.md` §6)
5. 1 step = minimal 1 commit dengan pesan jelas (`feat: step-3 product card component`)
6. Task selesai jika memenuhi exit criteria step tersebut + Definition of Done di `IMPLEMENTATION.md` §9
