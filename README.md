# 📱 Bagaskara Cell — Web Portal & Retail Catalog

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Split_DB-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://bagaskaracell.net)

Katalog produk smartphone & tablet mobile-first untuk toko retail **Bagaskara Cell Gresik**. Selain sebagai katalog, web ini dilengkapi dengan tools internal bisnis seperti **Kalkulator Profit Shopee**, **SMS Gateway (Litensi API)**, **Cek Resi Multi-Kurir**, dan **Visual Stock Manager Dashboard**.

Bukan e-commerce — tidak ada checkout/pembayaran. Customer memfilter stok berdasarkan **budget**, melihat spesifikasi, lalu menghubungi owner via **tombol WhatsApp pre-filled**.

---

## ✨ Fitur Premium

### 1. 🚀 Mobile-First Catalog & Rich Aesthetics
*   Desain premium, dinamis, dan ergonomis untuk pengalaman seluler terbaik (optimal di viewport 375px).
*   **Adaptive Theme Mode**: Mendukung Mode Terang & Gelap dengan transisi latar belakang preview produk yang responsif.
*   **Filter & Urutan Pintar**: Pencarian real-time, filter budget picker interaktif, chips filter kondisi (Baru, Second, Like New) dan merek.

### 2. 🧮 Shopee Fee & Profit Calculator (`/kalkulator/shopee`)
*   Perhitungan Presisi Tinggi: Mendukung simulasi komisi admin reguler, Mall, potongan Gratis Ongkir XTRA (GOX) terbaru (efektif Mei 2026), asuransi penjual (0.5%), dan biaya proses pesanan.
*   Simulasi Program Lengkap: Bandingkan potongan antara program Non-Star, Star, Star+, dan Shopee Mall sekaligus.
*   Affiliate / AMS Commission: Input persentase komisi affiliate/influencer kustom untuk rincian profit yang lebih akurat.
*   Dynamic Group Labeling: Setiap kategori produk secara otomatis dipetakan ke **Grup Shopee A s.d. H** resmi untuk mempermudah pencocokan tarif dengan pengumuman Shopee.
*   Kirim WA & Simpan Nomor: Mengirim rincian kalkulasi ke WhatsApp pribadi menggunakan nomor yang tersimpan di `localStorage` (`shopee_calc_user_phone`). Format pesan didesain premium dengan pemisah garis, emoji terstruktur, tebal/miring bergaya WhatsApp.

### 3. 🛍️ Tokopedia & TikTok Shop Fee & Profit Calculator (`/kalkulator/tokopedia`)
*   Perhitungan Komisi Dinamis: Mendukung tarif dinamis terbaru per 18 Mei 2026 untuk 30 kategori produk secara presisi.
*   Biaya Penjual & Promo: Simulasi komisi platform kustom, diskon seller, program promo GMV Max, komisi Affiliate, asuransi, logistik, order handling fee, dan estimasi pesanan bermasalah.
*   Disclaimer & Tabel Tarif Resmi: Menampilkan tabel komisi admin interaktif dan daftar FAQ informatif langsung di halaman aplikasi tanpa side effect.

### 4. 💬 SMS Gateway Integration (`/sms`)
*   Integrasi API Gateway Litensi untuk layanan aktivasi nomor SMS otomatis.
*   Mendukung pengecekan saldo, pembelian nomor, dan pembacaan kode verifikasi (OTP) secara real-time.
*   Dilindungi dengan sistem login token internal.

### 5. 📦 Cek Resi Multi-Kurir (`/cek-resi`)
*   Pelacakan status paket pengiriman secara real-time untuk berbagai ekspedisi populer (JNE, J&T, SiCepat, Wahana, Tiki, POS, dll).

### 6. 🖥️ Visual Stock Manager Dashboard (`/stok`)
*   Dashboard visual terlindungi PIN (`bagaskara`) untuk penambahan produk baru, edit varian, dan pembaruan status stok (**Ready** vs **Habis**) instan.

### 7. 📥 Media Downloader (`/media-downloader`)
*   Unduh video TikTok tanpa watermark, Reels/Video Instagram, dan video Facebook gratis secara langsung tanpa instalasi aplikasi tambahan.
*   Resolusi link unduhan direct dengan SSRF-hostname protection dan rate-limiting terstruktur.

### 8. 📈 Prediksi Pasar & Analisis Teknikal (`/prediction`)
*   **Probability Engine Deterministik**: Pembobotan otomatis indikator teknikal (RSI, MA Cross, MACD, Volume, Fear & Greed) untuk memproyeksikan probabilitas Naik/Sideways/Turun dalam horizon 7 hari ke depan.
*   **Asisten Narasi AI**: Integrasi Claude API (Sonnet) untuk memberikan narasi logis asisten ekonomi-statisticawan murni berbasis data pasar yang teruji aman (DYOR).
*   **Incremental Static Generation (ISR)**: Pre-render data pasar di tingkat server yang diperbarui tiap 10 menit guna indeksasi Google SEO maksimal.

### 9. 🗃️ Split SQLite Databases Security
*   Memisahkan data fisik lokal toko Anda (`database/owner.db`) dengan data hasil scraping Erafone (`database/erafone.db`) agar data rahasia/HPP internal aman dari pembersihan/impor scraper.

---

## 🛠️ Tech Stack

*   **Core:** [Next.js 16 (App Router)](https://nextjs.org/) & TypeScript
*   **Styling:** Tailwind CSS & Vanilla CSS
*   **Database:** `@libsql/client` (SQLite Serverless / Local Client)
*   **Scraper:** Python 3 + Playwright / BeautifulSoup (Erafone Scraper)
*   **SMS API:** Litensi API Client
*   **Deployment:** Vercel

---

## ⚙️ Setup & Cara Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 3. Jalankan Linter & Type Check
```bash
# Linter (ESLint)
npm run lint

# Type Check (TypeScript)
npx tsc --noEmit
```

### 4. Build Produksi
```bash
npm run build
```

---

## 🔄 Pembaruan & Impor Data Scraper Erafone

1.  Jalankan scraper python di folder `erafone_scraper` untuk menghasilkan berkas CSV baru (format `katalog_*.csv`).
2.  Pindahkan/pastikan file CSV berada di root proyek atau di dalam folder `erafone_scraper/`.
3.  Jalankan perintah impor untuk menyelaraskan data dengan database `erafone.db`:
    ```bash
    npm run import-csv
    ```

---

## 📁 Struktur Direktori Proyek

```
app/             # Jalur halaman Next.js (App Router) termasuk /stok, /kalkulator, /cek-resi, /sms
components/      # Komponen React (Card, Details, Badge, ProductInput, CategorySheet, dll.)
config/          # site.ts - Konfigurasi identitas toko, nomor WhatsApp & link media sosial
database/        # Berkas database SQLite (owner.db, erafone.db)
docs/            # Dokumentasi roadmap (IMPLEMENTATION.md) dan logs project
  └── sms/       # File panduan & instruksi integrasi SMS API Gateway
erafone_scraper/ # Script scraper Python untuk menarik data pre-order Erafone
types/           # Kontrak data dan Interface TypeScript
lib/             # Utilitas (Format Rupiah, SQLite Client, Filter Helper, WhatsApp Link builder)
public/          # Aset statis (Logo, Gambar lokal, Icon)
scripts/         # Skrip pengembang (seeding, stock CLI manager, importer CSV, split DB)
```

---

## 🔒 Lisensi & Hak Cipta
Hak Cipta © 2026 Bagaskara Cell. Dikembangkan khusus untuk pengelolaan operasional retail dan tools internal Bagaskara Cell.
