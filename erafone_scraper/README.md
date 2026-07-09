# Erafone Catalog Scraper v4 — Bagaskara Cell

Scraping katalog Erafone via hidden API, **sekarang bisa pecah per VARIAN**
(storage + warna + stok + harga per varian).

## Cara pakai
```bash
pip install -r requirements.txt
python erafone_scraper.py
```
Saat jalan, kamu ditanya:
1. Pilih kategori (1=Smartphone dst)
2. Pecah per varian? (y/n)
3. Ambil harga tiap varian? (y/n) — lebih lama tapi paling lengkap

## Cara kerja (2 tahap)
- **Tahap 1:** ambil daftar produk dari katalog → dapet `url_key` tiap produk.
- **Tahap 2:** buka detail tiap produk (`/products/{url_key}`) → pecah jadi
  per varian (storage + warna + SKU + stok).
- **Tahap 3 (opsional):** ambil harga tiap varian (endpoint promo/price).

## Kolom hasil (mode varian)
Nama · Brand · Tipe_Produk · SKU_Induk · Varian · Kapasitas · Warna ·
SKU_Varian · Harga_Normal · Harga_Promo · Stok_Qty · Status_Stok ·
Link_Gambar · Link_Produk

## Catatan penting
- Mode varian = 1 request per produk (+1 per kapasitas kalau ambil harga),
  jadi lebih lama. Disarankan jalanin **per kategori**, bukan "Semua Device".
- Harga per varian dihemat: dipanggil 1x per Kapasitas (harga sama antar warna).
- Endpoint harga butuh header auth statis (sudah dipasang di script). Kalau
  suatu saat harga gagal kebaca, token-nya mungkin berubah—tinggal update.
