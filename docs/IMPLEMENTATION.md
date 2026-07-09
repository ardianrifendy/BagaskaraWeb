# IMPLEMENTATION.md — Bagaskara Cell Catalog

> Katalog HP mobile-first, self-service berdasarkan budget, dengan CTA WhatsApp pre-filled.
> **Bukan e-commerce full** — tidak ada checkout/pembayaran. Website = katalog + lead generator ke WA.

---

## 1. Tech Stack

| Layer          | Pilihan                                      | Catatan                                            |
| -------------- | -------------------------------------------- | -------------------------------------------------- |
| Framework      | Next.js 14+ (App Router)                     | SSR/SSG untuk SEO, `next/image` untuk optimasi foto |
| Bahasa         | TypeScript (TSX)                             | Strict mode ON                                      |
| Styling        | Tailwind CSS                                 | Mobile-first, 1 warna aksen brand                   |
| Data (Fase 1)  | File JSON lokal (`/data/products.json`)      | Cukup untuk MVP, update via commit/redeploy         |
| Data (Fase 2)  | Supabase / Neon (PostgreSQL)                 | Free tier, kompatibel Vercel                        |
| Deploy         | Vercel                                       | Auto-deploy dari GitHub                             |
| Analytics      | Vercel Analytics / Umami                     | Tracking klik WA & produk populer                   |

---

## 2. Fase Pengembangan

### ✅ Fase 1 — MVP (target: 1–2 minggu)
Tujuan: customer bisa self-service cari HP sesuai budget, kamu berhenti bikin list manual.

- [x] Setup project: `create-next-app` + TypeScript + Tailwind
- [x] Struktur data produk (JSON) — lihat §3
- [x] **Landing page satu halaman scroll:**
  - [x] Section Hero: logo, tagline, trust signal (rating marketplace, COD Gresik) — max ½ layar HP
  - [x] Section Pilih Budget: chip besar `<1jt` / `1–2jt` / `2–3jt` / `3–5jt` / `5jt+` + tombol "Lihat-lihat dulu aja"
  - [x] Section Katalog: grid card (2 kolom mobile / 3–4 desktop)
- [x] Card produk: foto, nama, RAM/ROM, harga, badge kondisi (`Baru`/`Second`/`Like New`), badge stok (`Ready`/`Habis`), spek ringkas 1 baris
- [x] Filter chip horizontal: merk, kondisi, RAM (generate **dinamis dari data**, jangan hardcode)
- [x] Search bar + sort (harga terendah, terbaru)
- [x] Halaman detail produk: galeri foto, spec highlights (icon card), accordion spek lengkap, info kelengkapan/garansi/minus
- [x] **CTA WhatsApp pre-filled** di card & detail:
      `https://wa.me/62xxx?text=Halo,%20saya%20mau%20tanya%20{nama}%20harga%20{harga}`
- [x] **State filter masuk URL** (`?budget=2000000&brand=xiaomi`) → link shareable
- [x] Empty state: tampilkan produk range terdekat + tombol "Tanya stok via WA"
- [x] Floating WA button di katalog
- [x] Footer: nomor WA, alamat toko, link Google Maps
- [x] SEO dasar: metadata per halaman, slug produk di URL, sitemap, daftar Google Search Console
- [x] Deploy ke Vercel + pasang custom domain

### 🔜 Fase 2 — Database & Admin Panel
Trigger: update JSON manual mulai terasa ribet.

- [ ] Migrasi data ke Supabase/Neon
- [ ] Admin panel (route `/admin`, protected):
  - [ ] CRUD produk + varian
  - [ ] Upload foto (Supabase Storage / Vercel Blob)
  - [ ] Toggle stok per varian — **target: update 1 barang ≤ 30 detik dari HP**
- [ ] Section "Baru Masuk" di atas katalog
- [ ] Field `hargaCoret` (harga sebelum diskon) + badge promo

### 🔮 Fase 3 — Fitur Lanjutan
- [ ] **Compare** max 3 HP: floating bar sticky, tabel side-by-side header sticky, highlight nilai unggul, toggle "perbedaan saja", WA pre-filled hasil compare, URL shareable `/compare?items=a,b`
- [ ] Galeri foto dinamis per varian warna (swatch selector), harga & stok per kombinasi warna×storage
- [ ] Foto real per unit untuk barang second (data per-unit)
- [ ] Integrasi WhatsApp gateway (Baileys): auto-reply keyword budget → kirim link katalog terfilter

---

## 3. Struktur Data Produk

```ts
// types/product.ts
interface Product {
  id: string;              // slug, ex: "redmi-note-13-pro"
  brand: string;           // "Xiaomi"
  name: string;            // "Redmi Note 13 Pro"
  condition: "baru" | "second" | "like-new";
  specSummary: string;     // "8/256 · Snapdragon 7s Gen 2 · 5000mAh"
  specs: SpecGroup[];      // spesifikasi lengkap (accordion)
  highlights: SpecHighlight[]; // 4–6 icon card: chipset, RAM, kamera, baterai, layar, NFC
  variants: Variant[];
  warranty?: string;       // "Garansi toko 1 bulan"
  completeness?: string;   // "Fullset" | "Batangan"
  defects?: string[];      // minus untuk barang second
  createdAt: string;       // untuk sort "terbaru" & section "Baru Masuk"
}

interface Variant {
  id: string;
  color: string;           // "Midnight Black"
  colorHex: string;        // "#1a1a2e" — untuk swatch
  storage: string;         // "8/256"
  price: number;
  strikePrice?: number;    // hargaCoret (Fase 2)
  stock: "ready" | "habis";
  images: string[];        // foto per varian (Fase 3: per unit untuk second)
}

interface SpecHighlight { icon: string; label: string; value: string; }
interface SpecGroup { group: string; items: { label: string; value: string }[]; }
```

**Aturan data:**
- Harga & stok hidup di level **varian**, bukan produk.
- Filter merk/RAM di-generate dari data yang ada — merk tanpa stok tidak muncul di filter.
- Barang second: 1 unit fisik = 1 varian (foto kondisi real).

---

## 4. Struktur Halaman & Routing

```
app/
├── page.tsx                  # Landing: hero + budget picker + katalog
├── produk/[slug]/page.tsx    # Detail produk
├── compare/page.tsx          # Fase 3: ?items=a,b,c
├── admin/                    # Fase 2 (protected)
└── api/                      # Fase 2: CRUD endpoints
```

**Query params (semua shareable):**
| Param    | Contoh                    | Fungsi                    |
| -------- | ------------------------- | ------------------------- |
| `budget` | `?budget=2000000`         | Filter harga max / range  |
| `brand`  | `?brand=xiaomi,samsung`   | Filter merk               |
| `q`      | `?q=redmi`                | Search                    |
| `sort`   | `?sort=price-asc`         | Urutan                    |
| `items`  | `/compare?items=a,b`      | Compare (Fase 3)          |

---

## 5. Pipeline Pengerjaan Fase 1 (WAJIB BERURUTAN)

> Kerjakan **step demi step, jangan lompat**. Setiap step punya dependency dari step sebelumnya dan exit criteria. Satu step selesai → commit → baru lanjut. Ini mencegah kode berantakan dan rework.

### Step 0 — Foundation
**Kerjakan:** `create-next-app` (TypeScript + Tailwind + App Router), setup ESLint, struktur folder kosong (`components/`, `lib/`, `types/`, `data/`, `config/`), git init + push ke GitHub.
**Exit criteria:** `npm run dev` jalan, `npm run build` lolos, repo di GitHub.

### Step 1 — Kontrak Data (sebelum UI apapun!)
**Kerjakan:** `types/product.ts` (interface lengkap §3), `config/site.ts` (nomor WA, nama toko, alamat, link Maps), `data/products.json` isi **5–10 produk real dari stok toko** (bukan dummy asal — pakai data asli biar ketahuan kalau struktur kurang).
**Exit criteria:** `npx tsc --noEmit` bersih, JSON valid sesuai interface.
**Kenapa duluan:** semua komponen bergantung ke bentuk data. Ubah struktur data setelah UI jadi = rework semua komponen.

### Step 2 — Utility Layer
**Kerjakan:** `lib/formatRupiah.ts`, `lib/buildWaLink.ts`, `lib/filterProducts.ts` (filter by budget/brand/q + sort), `lib/getFilterOptions.ts` (generate opsi filter dinamis dari data).
**Exit criteria:** tiap util dites manual (atau unit test Vitest), type check bersih.
**Kenapa sebelum komponen:** logika terpisah dari tampilan = komponen tinggal pakai, gampang di-debug.

### Step 3 — Komponen Atomik (kecil → besar)
**Urutan:** `Badge` → `WhatsAppButton` → `PriceTag` → `ProductCard` → `SpecHighlights` → `BudgetPicker` → `FilterChips` → `SearchSort`.
**Exit criteria:** tiap komponen render benar di viewport 375px, props typed, tidak ada hardcode data toko.

### Step 4 — Halaman Landing (`app/page.tsx`)
**Kerjakan:** rakit hero → budget picker → katalog grid dari komponen Step 3. Wiring filter/search/sort ke **URL query params**. Empty state + fallback.
**Exit criteria:** buka `/?budget=2000000` → hasil terfilter benar; refresh halaman → state tetap; link bisa di-share.

### Step 5 — Halaman Detail (`app/produk/[slug]/page.tsx`)
**Kerjakan:** galeri foto, spec highlights, accordion spek lengkap, info kelengkapan/garansi/minus, CTA WA pre-filled (nama + varian + harga).
**Exit criteria:** klik dari card → detail benar; klik WA → pesan pre-filled benar; slug tidak ada → 404 rapi.

### Step 6 — Responsive & Polish
**Kerjakan:** audit semua halaman di 375px / 768px / 1280px, sticky header, floating WA button, footer (WA + alamat + Maps), loading & error states.
**Exit criteria:** tidak ada layout pecah di 3 breakpoint, Lighthouse mobile Performance ≥ 90.

### Step 7 — SEO & Deploy
**Kerjakan:** metadata per halaman, Open Graph (preview link bagus di WA!), sitemap, robots.txt, deploy Vercel, pasang custom domain, daftar Google Search Console, pasang analytics.
**Exit criteria:** share link di WA → preview muncul (judul + gambar); domain live; analytics merekam.

### Step 8 — UAT (User Acceptance Test) oleh Owner
**Kerjakan:** kamu sendiri tes sebagai customer dari HP: buka link budget → pilih produk → cek spek → klik WA. Catat semua yang janggal → perbaiki → baru sebar link ke customer.
**Exit criteria:** semua poin Definition of Done (§9) tercentang.

**Aturan git:** 1 step = minimal 1 commit dengan pesan jelas (`feat: step-3 product card component`). Jangan gabung banyak step dalam 1 commit.

---

## 6. Perilaku Responsive per Komponen

| Komponen        | Mobile (< 768px)                          | Desktop (≥ 1024px)                      |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| Grid katalog    | 2 kolom                                    | 3–4 kolom                                |
| Hero            | Max ½ tinggi layar, stack vertikal         | Lebih lega, bisa 2 kolom (teks + visual) |
| Budget picker   | Chip besar 2 baris, thumb-friendly         | 1 baris horizontal                       |
| Filter          | Chip scroll horizontal + bottom sheet      | Chip inline lebih lebar / panel atas     |
| Header          | Sticky: search + tombol filter             | Sticky: search + filter inline           |
| Detail produk   | Stack: galeri → info → spek                | 2 kolom: galeri kiri, info kanan         |
| Tombol WA       | Floating button kanan bawah                | Floating + CTA inline di detail          |
| Compare (F3)    | Scroll horizontal, header sticky           | Tabel penuh tanpa scroll                 |

Implementasi: Tailwind breakpoints — class tanpa prefix = mobile, `md:` = tablet, `lg:` = desktop. Contoh: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. **Satu codebase responsive, bukan dua versi terpisah.**

---

## 7. Prinsip UI/UX (Wajib)

1. **Mobile-first** — mayoritas traffic dari link WA di HP.
2. **Show the goods fast** — tidak ada wizard/popup blocking sebelum katalog; budget picker adalah section, bukan gate.
3. Chip filter horizontal scrollable, filter lanjutan via bottom sheet — bukan sidebar.
4. Filter aktif tampil sebagai chip yang bisa dihapus (`Budget: 1–2jt ✕`).
5. Sticky header (search + filter) saat scroll.
6. Desain clean: dominan putih + 1 aksen brand; foto produk = bintang utama.
7. Semua foto lewat `next/image` (compress + lazy load). Website lemot = customer kabur.
8. Empty state selalu punya jalan keluar (produk terdekat + tombol WA).

---

## 8. Keputusan Non-Teknis (SOP)

- **Disiplin stok = nyawa website.** "Ready" di web tapi kosong di toko = trust rusak. Update stok masuk SOP harian.
- **SOP foto:** 1 spot tetap di toko, lighting konsisten, background polos, 4–6 angle untuk second.
- **Domain:** amankan `bagaskaracell.com` / `.id` sebelum launch (~150–200rb/tahun). Subdomain `*.vercel.app` hanya untuk staging.
- **Analytics dipakai untuk kulakan:** produk paling dilihat + budget paling dicari = sinyal demand.

---

## 9. Definition of Done — Fase 1

- [x] Buka link `?budget=2000000` dari HP → langsung lihat semua stok ≤ 2jt tanpa langkah tambahan
- [x] Klik produk → lihat spek lengkap tanpa perlu tanya via chat
- [x] Klik tombol WA → chat terbuka dengan nama produk & harga sudah terisi
- [x] Lighthouse mobile score ≥ 90 (Performance)
- [x] Kamu bisa share 1 link sebagai jawaban untuk pertanyaan "budget X ada apa?"
