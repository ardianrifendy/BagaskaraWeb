# CLAUDE.md — SMS Activation Tool

Dokumentasi konteks dan panduan teknis khusus untuk Claude dalam mengelola dan mengembangkan SMS Activation Tool.

---

## 1. Perintah Cepat (Quick Commands)

Gunakan perintah-perintah berikut untuk memelihara dan memeriksa status kode:

```bash
npm run dev                  # Menjalankan dev server local
npx tsc --noEmit             # Melakukan pemeriksaan tipe TypeScript
npm run lint                 # Memvalidasi kode dengan ESLint
npm run build                # Membangun build produksi Next.js
```

---

## 2. API Endpoint & Kode Status Referensi

Base URL API: `https://litensi.id/api/sms/handler_api.php`

### Kode Status Pengisian SMS (`activationStatus` / `getStatus`):
- `1`: `STATUS_WAIT_CODE` — Menunggu SMS masuk.
- `3`: `STATUS_WAIT_RETRY` — Menunggu SMS berikutnya setelah retry (status 3).
- `4`: `STATUS_OK:<code>` — SMS berhasil diterima dengan kode verifikasi.
- `6`: `ACCESS_ACTIVATION` — Aktivasi selesai / dikonfirmasi.
- `8`: `ACCESS_CANCEL` / `STATUS_CANCEL` — Aktivasi dibatalkan.

### Parameter Aksi `setStatus` (Mengubah Status Nomor):
- `status=3`: Meminta kirim ulang SMS (Retry).
- `status=6`: Menyelesaikan pesanan secara permanen (Finish).
- `status=8`: Membatalkan pesanan (Cancel).

---

## 3. Penanganan Error yang Sering Terjadi (Common Errors)

Buat pemetaan error yang jelas di UI berdasarkan respon provider:
- `NO_KEY` / `BAD_KEY`: Tampilkan alert bahwa API Key salah atau tidak terisi.
- `NO_BALANCE`: Tampilkan alert saldo tidak mencukupi untuk melakukan pesanan.
- `NO_NUMBERS`: Tampilkan pesan stok nomor untuk kombinasi negara + layanan + operator sedang kosong.
- `BAD_SERVICE`: Layanan atau negara tidak valid.
- `BAD_STATUS`: Status tidak valid (misal: mencoba cancel nomor yang sudah selesai).
- `TOO_MANY_ACTIVE_ACTIVATIONS`: Batas jumlah nomor aktif tercapai.

---

## 4. Standar UI/UX Khusus SMS Activation

- **Clipboard Integration**: Gunakan API browser `navigator.clipboard.writeText` untuk menyalin nomor telepon atau kode SMS yang masuk secara instan ketika elemen diklik, dan tampilkan indikator "Tersalin!" (Copied!) sementara.
- **Auto-Scroll Logs**: Panel log yang menampilkan riwayat request/response harus otomatis menggulir ke bawah (auto-scroll to bottom) ketika ada log baru masuk.
- **Sound Effect (Web Audio API)**: Karena kita tidak ingin mengandalkan asset file MP3 eksternal yang bisa hilang, gunakan generator bunyi "Beep" menggunakan Web Audio API internal browser untuk memberikan notifikasi suara ketika SMS diterima:
  ```typescript
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nada A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // Bunyi selama 150ms
    } catch (e) {
      console.warn("Failed to play audio alert", e);
    }
  };
  ```
- **Time Elapsed Counter**: Sediakan counter dinamis yang menghitung menit/detik sejak nomor dipesan untuk memberikan feedback visual kepada user seberapa lama nomor tersebut aktif (biasanya limit 20 menit).
