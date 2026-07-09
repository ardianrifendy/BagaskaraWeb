# Panduan Update Stok & Penjelasan Database

Folder ini berisi 2 database SQLite terpisah untuk memisahkan stok fisik toko Anda dengan katalog referensi Erafone.

## 🗃️ Penjelasan File Database

1. **`owner.db` (Stok Fisik Owner)**
   * Berisi data HP stok fisik Anda sendiri (Baru, Second, Like New).
   * Data ini **aman** dan tidak akan pernah tertimpa saat Anda melakukan impor data scraper Erafone baru.
   
2. **`erafone.db` (Katalog Referensi Erafone / PO)**
   * Berisi data HP hasil scraping Erafone (untuk pemesanan Pre-Order / PO 1-3 Hari).
   * Data ini akan diperbarui/ditimpa secara otomatis saat Anda menjalankan skrip impor CSV Erafone.

---

## 🔄 Cara Melakukan Update Stok

Anda dapat memperbarui status stok produk (mengubah status menjadi **Tersedia** atau **Habis**) dengan cara berikut:

### Metode A: Melalui Dashboard Web Visual (Sangat Direkomendasikan & Paling Mudah)
1. Buka halaman dashboard stok di browser Anda: [http://localhost:3000/stok](http://localhost:3000/stok)
2. Masukkan PIN keamanan toko Anda (default: `bagaskara`).
3. Anda akan masuk ke dashboard visual yang sangat ramah pengguna:
   * **Cari HP:** Gunakan bilah pencarian real-time untuk menemukan unit dengan cepat.
   * **Tambah HP Baru:** Klik tombol **"+ HP Baru"** untuk menginput seri produk baru.
   * **Kelola Varian:** Klik pada nama HP untuk membuka daftar warna, harga, dan kapasitas penyimpanan.
   * **Update Stok Instan:** Cukup **klik/ketuk satu tombol status (🟢 Ready / 🔴 Habis)** pada varian yang diinginkan, dan stok di database akan langsung terupdate detik itu juga.
   * **Tambah Varian:** Klik **"+ Tambah Varian"** untuk memasukkan warna atau memori baru ke HP tersebut.

### Metode B: Melalui Command Line Interaktif (CLI)
1. Buka Terminal / PowerShell di folder utama website ini.
2. Jalankan perintah:
   ```bash
   npm run update-stock
   ```
3. Cari nama HP yang ingin Anda ubah statusnya.
4. Pilih database target yang sesuai (Stok Owner atau PO Erafone).
5. Pilih varian warna & kapasitas penyimpanan.
6. Ubah status stok menjadi `READY` atau `HABIS`.

### Metode B: Melalui Update CSV Erafone (Khusus erafone.db)
1. Lakukan scraping baru atau edit berkas CSV katalog terbaru Anda (misalnya: `katalog_smartphone_db_varian_xxxx.csv` di folder scraper).
2. Temukan varian produk yang ingin Anda ubah, lalu sesuaikan nilai kolom `stock` menjadi `ready` atau `habis`.
3. Simpan perubahan berkas CSV Anda.
4. Jalankan perintah di Terminal untuk mengimpor ke database Erafone:
   ```bash
   npm run import-csv
   ```
