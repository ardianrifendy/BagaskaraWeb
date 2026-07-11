# Task List — SMS Activation Tool

Checklist pengerjaan implementasi Dashboard SMS Activation Tool. Gunakan format ini untuk mencatat progres pengerjaan.

- [ ] **Fase 1: Setup & API Proxy Handler**
  - [ ] Buat file handler API di [route.ts](file:///d:/BagaskaraWeb/app/api/sms/route.ts)
  - [ ] Konfigurasikan fallback API Key default dan support untuk custom API Key dari query params
  - [ ] Lakukan penanganan error jika API Provider tidak dapat dihubungi atau mengembalikan error code (`NO_KEY`, `BAD_KEY`, dll.)
  - [ ] Tes endpoint `/api/sms?action=getBalance` menggunakan browser atau command line

- [ ] **Fase 2: Struktur Page & State Management**
  - [ ] Buat halaman utama di [page.tsx](file:///d:/BagaskaraWeb/app/sms/page.tsx) dengan `"use client"`
  - [ ] Definisikan interfaces untuk model data: `Activation`, `Country`, `Service`, `Operator`, `PriceData`
  - [ ] Siapkan state React utama: `apiKey`, `balance`, `countries`, `services`, `operators`, `activeActivations`, `loading`, `logs`

- [ ] **Fase 3: Pembuatan UI Form Pemesanan (Order Form)**
  - [ ] Buat formulir dengan grid responsif untuk memilih negara, layanan, operator, harga maksimal, fixed price, dan phoneException
  - [ ] Fetch data negara (`getCountries`) dan layanan (`getServicesList`) secara dinamis saat halaman pertama kali dimuat
  - [ ] Fetch data operator (`getOperators`) berdasarkan negara yang sedang dipilih secara dinamis
  - [ ] Tambahkan shortcut cepat (Quick Selection) untuk layanan populer: WhatsApp (`wa`), Telegram (`tg`), Google/Gmail (`go`)

- [ ] **Fase 4: Pembuatan UI Daftar Aktivasi Aktif (Active List)**
  - [ ] Buat list card modern untuk menampilkan nomor yang sedang aktif
  - [ ] Tampilkan detail: Nomor HP, Service Code, Biaya (format Rupiah), Status Badge, Waktu Order, dan Umur Pesanan
  - [ ] Implementasikan tombol aksi per nomor:
    - [ ] **Cancel (Batal)** -> Mengirim request `setStatus&status=8`
    - [ ] **Finish (Selesai)** -> Mengirim request `setStatus&status=6`
    - [ ] **Retry (Minta SMS Baru)** -> Mengirim request `setStatus&status=3`
  - [ ] Implementasikan auto-fetch untuk mengambil ulang daftar nomor aktif secara periodik (misal tiap 15 detik)

- [ ] **Fase 5: Mekanisme Polling SMS & Pemberitahuan**
  - [ ] Buat custom hook atau logic `useEffect` untuk melakukan polling `getStatus` setiap 5 detik untuk nomor berstatus menunggu
  - [ ] Jika status berubah menjadi `STATUS_OK:<code>`, perbarui status lokal, hentikan polling untuk nomor tersebut, dan tampilkan kode SMS dalam ukuran besar
  - [ ] Integrasikan bunyi notifikasi suara singkat saat kode berhasil diterima
  - [ ] Tambahkan fitur 1-klik untuk menyalin kode SMS ke clipboard

- [ ] **Fase 6: Fitur Tambahan & Log Box**
  - [ ] Implementasikan pengecekan opsi reaktivasi (`reactivateOptions`) dan tombol reaktivasi (`reactivate`) untuk nomor yang sudah selesai
  - [ ] Tambahkan component log box (collapsible/scrollable) di bagian bawah halaman untuk melacak histori aktivitas API secara real-time

- [ ] **Fase 7: Finalisasi & Pengujian**
  - [ ] Lakukan verifikasi responsivitas UI pada viewport mobile (375px) dan desktop
  - [ ] Jalankan pengecekan TypeScript (`npx tsc --noEmit`)
  - [ ] Jalankan linter (`npm run lint`)
  - [ ] Jalankan build produksi (`npm run build`) untuk memastikan aplikasi siap di-deploy ke Vercel tanpa hambatan
