# Fitur Jasa Titip (Jastip) — bagaskaracell.net

Dokumentasi ini menjelaskan setup, migrasi database, seeding, pengujian, dan penataan fitur Jasa Titip (`/jastip`) pada bagaskaracell.net.

---

## 1. Environment Variables (.env.local)

Tambahkan variabel berikut ke file `.env.local` Anda (pastikan Neon Postgres dideploy di region Singapore / `sin1`):

```bash
# Neon Postgres Database URL (Singapore region)
DATABASE_URL=postgresql://user:password@ep-xxxx-xxxx.sg-singapore.pooler.neon.tech/neondb?sslmode=require

# Kata sandi dashboard admin Jastip
JASTIP_ADMIN_PASSWORD=admin_password_disini

# Token Vercel Blob untuk upload foto bukti belanja
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_disini

# Upstash Redis (Opsional untuk Rate Limiting, fallback in-memory LRU)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=token_upstash_disini
```

---

## 2. Struktur Data & Migrasi Database

Fitur ini menggunakan Neon Postgres + Drizzle ORM. Konfigurasi tersimpan di `drizzle.config.ts`.

Untuk menyinkronkan struktur tabel ke Neon, jalankan perintah:
```bash
# Sinkronisasi skema ke database
npx drizzle-kit push
```

Tabel yang dibuat:
- `batches`: Pengelompokan pengiriman per kloter jastip (kurs terkunci, status jastip).
- `orders`: Data pesanan jastip dengan kode unik `JST-XXXX-XXXX`.
- `order_items`: Barang titipan di dalam pesanan (estimasi harga vs aktual, foto bukti Vercel Blob, status barang).
- `payments`: Riwayat pembayaran DP, pelunasan, atau refund.
- `status_logs`: Log audit trail perpindahan status pembayaran & barang.

---

## 3. Seed Data Contoh

Untuk mengisi database dengan data contoh (1 batch aktif, 2 pesanan, item belanjaan, dan riwayat pembayaran), jalankan:
```bash
npm run seed-jastip
```

---

## 4. Pengujian (Testing)

Pengujian unit-test menggunakan Node.js test runner bawaan. Jalankan perintah:
```bash
npx tsx --test lib/jastip/jastip.test.ts
```

Tes ini akan menguji:
- **Format & Tabrakan Kode Order**: Memastikan generator unik 1000x dan Crockford Base32 bebas karakter ambigu.
- **Normalisasi Kode**: Memastikan lookup toleran terhadap spasi, huruf kecil, dan dash.
- **Perhitungan Harga**: Memastikan keselarasan kalkulasi harga barang, flat/percent fee, dan ongkir proporsional.

---

## 5. Alur Penggunaan Dasbor Admin

1. Buka `/jastip/admin` di browser.
2. Masukkan kata sandi admin jastip (sesuai `JASTIP_ADMIN_PASSWORD`).
3. Anda akan diarahkan ke dasbor pesanan (`/jastip/admin/orders`).
4. Buka tab **Batches** (`/jastip/admin/batches`) untuk membuat atau mengedit batch jastip aktif (misal: kloter Malaysia, Singapore). Tentukan kurs & fee jastip di sini.
5. Kembali ke tab **Orders** untuk membuat pesanan baru. Kode order pelacakan akan di-generate otomatis oleh sistem.
6. Klik **Kelola** pada pesanan untuk menambah item belanjaan pelanggan, mencatat DP, mengunggah foto struk/barang, atau memasukkan nomor resi ekspedisi lokal.
7. Pelanggan dapat memantau status belanjaan mereka kapan saja dengan memasukkan kode order di halaman `/jastip` publik.
