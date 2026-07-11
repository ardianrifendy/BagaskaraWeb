# AGENTS.md — SMS Activation Tool

Instruksi dan aturan wajib bagi AI coding agents (Claude Code, Cursor, Copilot, dll.) yang memodifikasi, memelihara, atau mengembangkan fitur SMS Activation Tool di dalam repository ini.

---

## 1. Aturan Keamanan & Kredensial

- **Jangan Pernah Menulis Hardcode API Key ke Git.** API Key default `FDsgdf9EKGJ3TqfuN5WAODoavHLf4lvz` ditaruh secara aman di sisi server melalui default fallback atau disimpan di `.env.local` sebagai `SMS_ACTIVATION_API_KEY`.
- UI harus menyediakan input API Key agar user dapat menggunakan key mereka sendiri secara opsional, tetapi selalu pre-fill dengan API Key yang disediakan default.

---

## 2. Aturan Struktur & Routing

- Halaman dashboard **wajib** diletakkan di `app/sms/page.tsx` (menggunakan Next.js App Router).
- API Proxy Handler **wajib** diletakkan di `app/api/sms/route.ts`.
- Hindari membuat router/halaman di luar struktur ini kecuali jika diperintahkan secara tertulis.

---

## 3. Standard Koding & TypeScript

- Gunakan TypeScript **strict mode**. Definisikan interface yang jelas untuk setiap respon API (misalnya respon `getCountries`, `getServicesList`, `getActiveActivations`, dan `reactivateOptions`).
- Hindari penggunaan tipe `any`. Jika tipe data dinamis, gunakan `Record<string, unknown>` atau buat interface yang sesuai.
- Gunakan React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`) secara efisien untuk menangani polling status SMS tanpa memicu re-render yang tidak perlu.

---

## 4. Antarmuka Pengguna (UI) & Estetika

- **Desain Premium & Modern**: Desain wajib memanjakan mata, responsif (uji di mobile 375px & desktop 1280px), menggunakan grid layout, card glassmorphism, dan status badge yang cerah.
- **Support Mode Gelap/Terang**: Styling Tailwind harus mendukung kelas `dark:` agar transisi tema terlihat sempurna.
- **Validasi Output Besar**: Kode SMS yang diterima wajib ditampilkan dengan font berukuran besar (misalnya `text-3xl` atau `text-4xl` dengan font bold) dan dilengkapi tombol 1-klik untuk menyalin (Copy to Clipboard) kode tersebut.
- **Suara Notifikasi**: Tambahkan notifikasi suara (audio alert) yang diputar saat kode SMS berhasil diterima (`STATUS_OK`). Gunakan file audio ringan atau sintesis Web Audio API sederhana jika file audio tidak tersedia.

---

## 5. Flow Polling Status SMS

- Untuk nomor yang berstatus "Waiting for SMS" (`STATUS_WAIT_CODE`), lakukan pemanggilan API `getStatus` secara berkala (polling) setiap **5 detik**.
- Gunakan `useEffect` dengan pembersihan (`cleanup function` via `clearInterval` atau `clearTimeout`) agar tidak terjadi kebocoran memori (memory leak) jika user meninggalkan halaman atau menutup pesanan.
- Berikan batas waktu polling maksimum (misal: 15-20 menit) untuk mencocokkan waktu aktif dari nomor provider sebelum otomatis menghentikan polling.

---

## 6. Definition of Done (DoD)

Sebelum menyelesaikan pekerjaan pada modul ini, pastikan:
1. `npx tsc --noEmit` bersih tanpa error kompilasi TypeScript.
2. `npm run lint` bersih tanpa error linter.
3. Halaman `/sms` berjalan normal di browser dan proxy API `/api/sms` merespon dengan benar.
4. Perubahan tidak merusak bagian kode catalog utama (`app/page.tsx`, `components/`, dll.).
