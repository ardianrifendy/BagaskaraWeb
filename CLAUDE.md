# CLAUDE.md — bagaskaracell.net

Konteks proyek untuk Claude Code. Baca file ini sebelum mengerjakan task apa pun.

## Tentang Proyek

- **Situs:** bagaskaracell.net — katalog HP Bagaskara Cell (toko HP di Cerme, Gresik, Jawa Timur) + kumpulan tool gratis untuk pengunjung.
- **Tool yang sudah live:** `/kalkulator-shopee`, `/cek-resi` (BinderByte), `/media-downloader` (TikTok/IG/FB downloader).
- **Fitur yang sedang dibangun:** `/prediction` — dashboard analisis probabilistik pasar. Lihat `implementation.md` (spesifikasi) dan `agents.md` (pembagian multi-agent).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Deploy: Vercel serverless — perhatikan limit: response body function ±4.5MB, timeout pendek, tidak ada state persisten antar-invocation.
- Tanpa library UI eksternal; komponen manual dengan Tailwind. Chart pakai SVG manual.

## Konvensi Kode

- TypeScript strict; hindari `any`; tipe fitur di `lib/<fitur>/types.ts`.
- Server component default; `"use client"` hanya jika perlu state/efek.
- API route: `app/api/<fitur>/<aksi>/route.ts`; respons JSON `{ ok: boolean, ... }`; error punya `error` (kode) + `message` (Bahasa Indonesia).
- Fetch eksternal: selalu timeout (AbortController) + try/catch; gunakan caching Next (`next: { revalidate }` / `unstable_cache`) — JANGAN hit API eksternal per pengunjung.
- Jangan tambah dependency tanpa alasan kuat; env baru wajib masuk `.env.example`; jangan commit secret.

## Gaya Bahasa & Copy Situs (WAJIB)

- **Bahasa Indonesia baku tapi hangat**, sapaan **"Anda"** (bukan "kamu"/"lo").
- Pola `<title>`: `"<Nama Fitur> — Bagaskara Cell"`; `og:locale` `id_ID`.
- Pola hero tool page: H1 pendek (2–3 kata) + subtitle 1 kalimat berorientasi manfaat. Contoh eksisting: "Lacak Pengiriman" / "Pantau status dan riwayat pengiriman pesanan handphone Anda dari Bagaskara Cell secara real-time."
- Tool page punya link **"Kembali ke Katalog"** ke `/`.
- Emoji hemat dan fungsional (⚙️ 📦 🏷️ 📈 📉).
- Nada brand: *aman, transparan, terpercaya, bergaransi, gratis, cepat*.
- Format Indonesia: `Intl.NumberFormat("id-ID")`, Rupiah tanpa desimal, zona waktu `Asia/Jakarta` dengan label "WIB".
- Footer standar: alamat toko (Perumahan Bhummi Cermai Apsari, Cerme, Gresik), WA CS 1 & CS 2, link Shopee & Instagram, copyright.

## Aturan Khusus /prediction

- Scope v1: BTC, ETH, SOL, BNB (CoinGecko, vs IDR) + USD/IDR (Frankfurter) + Fear & Greed (alternative.me). Semua tanpa API key, wajib di-cache (harga 10 mnt, F&G 1 jam).
- **Angka probabilitas HANYA dihasilkan `lib/prediction/score.ts`** (Probability Engine deterministik). LLM dilarang membuat/mengubah angka — hanya menarasikan.
- Narasi AI: Claude API `claude-sonnet-4-6`, persona ekonom-statistikawan (prompt di `lib/prediction/prompt.ts`), cache 6 jam per aset. `ANTHROPIC_API_KEY` kosong → fitur narasi mati dengan anggun, sisanya tetap jalan.
- **Kata terlarang di seluruh copy & output AI:** pasti, dijamin, sinyal beli, sinyal jual. Ada post-check regex di route analysis.
- Disclaimer DYOR wajib tampil mencolok: analisis statistik-edukatif, bukan saran keuangan/investasi.
- Ceiling probabilitas ±63–70% adalah fitur, bukan bug — jangan dinaikkan melebihi ~75%.
- Provider gagal → partial success per aset (`unavailable: true`), bukan halaman error.

## Aturan Khusus /media-downloader (sudah live)

- Platform: TikTok (tikwm), IG/FB hanya jika `COBALT_API_URL` diset. **JANGAN dukung YouTube** — keputusan final.
- Server hanya resolve direct URL; tidak proxy/stream file. Rate limit 10 req/mnt/IP. Whitelist hostname anti-SSRF. Disclaimer hak cipta wajib.

## Perintah Umum

```bash
npm run dev      # dev server
npm run lint     # lint
npm run build    # build produksi (wajib lolos sebelum commit fitur)
```

## Definition of Done Umum

1. `npm run lint` + `npm run build` bersih; unit test fitur lolos.
2. Copy UI 100% Bahasa Indonesia sesuai "Gaya Bahasa".
3. Mobile-first: layak di layar 360px.
4. Tidak ada secret ter-hardcode; env terdaftar di `.env.example`.
5. Route baru masuk sitemap dan navbar tools.
