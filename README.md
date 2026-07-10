# 📱 Bagaskara Cell Catalog

Katalog produk smartphone & tablet mobile-first untuk toko retail **Bagaskara Cell Gresik**. Memudahkan pelanggan menyaring produk berdasarkan budget, melihat spesifikasi lengkap, memilih warna & kapasitas secara interaktif, dan menghubungi owner langsung via WhatsApp dengan pesan otomatis (*pre-filled*).

---

## ✨ Fitur Utama

- **🚀 Mobile-First Design & Rich Aesthetics:** Desain premium, dinamis, dan ergonomis untuk pengalaman seluler terbaik.
- **🌓 Adaptive Theme Mode:** Mendukung Mode Terang & Gelap dengan integrasi latar belakang preview produk yang responsif (`bg-white` di mode terang, `bg-black` di mode gelap).
- **🔍 Filter & Urutan Pintar:**
  - Pencarian nama produk & brand secara real-time.
  - Filter rentang harga (budget picker) interaktif.
  - Filter kondisi (Baru, Second, Like New) dan Filter Merek (Brand Chips).
- **🗃️ Split SQLite Databases:** Memisahkan data fisik lokal toko Anda (`database/owner.db`) dengan data PO scraping Erafone (`database/erafone.db`) agar data pribadi aman dari pembersihan/impor scraper.
- **🖥️ Visual Stock Manager Dashboard (`/stok`):** Halaman input & edit stok visual yang dilindungi PIN toko (`bagaskara`). Memudahkan penambahan HP baru, penambahan varian, dan pembaruan stok (Ready vs Habis) secara instan hanya dengan sekali klik.
- **💬 Pre-filled WhatsApp Link:** Tombol hubungi WhatsApp secara otomatis mengemas nama produk, warna, kapasitas penyimpanan yang dipilih, dan harga ke dalam format tautan chat.
- **🔌 Erafone Scraper Integrator:** Memungkinkan pembaruan data katalog pre-order secara instan hasil scrap website Erafone secara langsung.

---

## 🛠️ Tech Stack

- **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript
- **Styling:** Tailwind CSS + Vanilla CSS (Aesthetics & Dark Mode support)
- **Database Client:** `@libsql/client` (SQLite Serverless / Local Client)
- **Scraper:** Python + Playwright / BeautifulSoup (Erafone Scraper)
- **Developer Tools:** `tsx` untuk eksekusi script TypeScript langsung.

---

## ⚙️ Cara Menjalankan Project

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) (Lokal) atau [https://bagaskaracell.net](https://bagaskaracell.net) (Produksi) untuk melihat web katalog. Untuk mengelola stok secara visual, buka [http://localhost:3000/stok](http://localhost:3000/stok) atau [https://bagaskaracell.net/stok](https://bagaskaracell.net/stok).

### 3. Jalankan Linter & Type Check
```bash
# Linting
npm run lint

# Type Check
npx tsc --noEmit
```

### 4. Build untuk Production
```bash
npm run build
```

---

## 🔄 Cara Pembaruan & Manajemen Stok

### Metode A: Melalui Dashboard Web Visual (Sangat Direkomendasikan)
1. Buka [https://bagaskaracell.net/stok](https://bagaskaracell.net/stok) (atau [http://localhost:3000/stok](http://localhost:3000/stok) jika lokal) di browser.
2. Masukkan PIN keamanan toko: `bagaskara`.
3. Anda dapat mencari HP, menambah HP baru, menambah varian, dan mengubah status stok menjadi **Ready** atau **Habis** dengan sekali klik.

### Metode B: Melalui Impor CSV Scraper Erafone
Jika Anda melakukan scraping data baru menggunakan **Erafone Scraper**:
1. Jalankan scraper dan hasilkan berkas CSV baru di dalam folder `erafone_scraper/`.
2. Jalankan perintah impor untuk memperbarui database `erafone.db`:
   ```bash
   npm run import-csv
   ```

### Metode C: Melalui Command Line Interaktif (CLI)
Anda juga bisa memodifikasi status stok via terminal dengan perintah:
```bash
npm run update-stock
```

---

## 📁 Struktur Direktori

```
app/             # Jalur halaman Next.js (App Router) termasuk /stok
components/      # Komponen React (Card, Details, Badge, ThemeToggle, dll.)
database/        # Berkas database SQLite (owner.db, erafone.db, panduan update)
docs/            # Dokumentasi roadmap (IMPLEMENTATION.md) dan log progress
config/          # site.ts - Konfigurasi identitas toko, nomor WhatsApp & gambar latar
erafone_scraper/ # Script scraper Python untuk menarik data pre-order Erafone
types/           # Interface dan Kontrak Data TypeScript
lib/             # Utilitas (Format Rupiah, SQLite Client, Filter Helper)
public/          # Aset statis (Logo, Gambar lokal)
scripts/         # Skrip pengembang (seeding, stock CLI manager, importer CSV)
```
