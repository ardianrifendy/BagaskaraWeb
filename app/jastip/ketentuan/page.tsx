import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { siteConfig } from "@/config/site";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Ketentuan Layanan Jastip — Bagaskara Cell",
  description: "Syarat dan Ketentuan layanan Jasa Titip (Jastip) barang luar negeri di Bagaskara Cell.",
  openGraph: {
    title: "Ketentuan Layanan Jastip — Bagaskara Cell",
    description: "Syarat dan Ketentuan layanan Jasa Titip (Jastip) barang luar negeri di Bagaskara Cell.",
    type: "website",
    locale: "id_ID",
    siteName: "Bagaskara Cell",
  }
};

export default function JastipKetentuanPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">

      {/* Sticky Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">

        {/* Title and Intro */}
        <div className="text-center space-y-2">
          {/* Breadcrumb / Back button */}
          <Link
            href="/jastip"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-neutral-400 dark:text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Jastip
          </Link>

          <h1 className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 tracking-tight">
            Syarat & Ketentuan Jastip
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-400 dark:text-zinc-450 leading-relaxed">
            Harap membaca ketentuan layanan Jasa Titip di Bagaskara Cell sebelum melakukan pemesanan.
          </p>
        </div>

        {/* T&C Content Card */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-zinc-300">

          <section className="space-y-2">
            <h2 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-600">01.</span> Sistem Pemesanan & Down Payment (DP)
            </h2>
            <p>
              Setiap penitipan barang wajib disertai dengan pembayaran uang muka (Down Payment) sebesar minimal <strong>50%</strong> dari estimasi harga total barang dalam Rupiah. Pesanan baru akan mulai diproses (dibelanjakan) setelah bukti pembayaran DP diverifikasi oleh admin kami.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-600">02.</span> Pembelian & Substitusi Barang
            </h2>
            <p>
              Admin/owner akan berupaya maksimal untuk mencarian barang titipan sesuai spesifikasi (warna, varian, ukuran) yang Anda minta. Jika barang utama kosong:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Jika Anda mengaktifkan opsi <strong>"Substitusi OK"</strong>, kami akan membelikan varian alternatif terdekat yang tersedia di toko tanpa konfirmasi ulang.</li>
              <li>Jika opsi tidak diaktifkan, kami akan membatalkan item tersebut dan mengembalikan dana (refund) untuk item terkait.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-600">03.</span> Bea Cukai & Pajak Masuk
            </h2>
            <p>
              Seluruh barang jastip luar negeri akan dideklarasikan secara resmi melalui Bea Cukai Indonesia. Pajak masuk, bea masuk, dan PPN impor yang timbul dari proses impor barang jastip sudah dimasukkan ke dalam perhitungan komisi/fee jastip final yang kami tawarkan di awal. Tidak ada biaya siluman di kemudian hari mengenai pajak masuk ini.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-600">04.</span> Estimasi Kedatangan (ETA)
            </h2>
            <p>
              Tanggal ETA yang dicantumkan merupakan estimasi perkiraan barang sampai di gudang kami di Gresik. Kami tidak memberikan jaminan garansi ketepatan waktu dikarenakan adanya potensi keterlambatan kargo internasional atau proses clearance Bea Cukai di bandara/pelabuhan yang berada di luar kendali kami.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-600">05.</span> Pelunasan & Pengiriman Domestik
            </h2>
            <p>
              Pelunasan sisa pembayaran <strong>wajib dilakukan maksimal 7 hari</strong> setelah barang dikonfirmasi tiba di gudang Gresik dan siap dikirim ke alamat Anda. Barang hanya akan dikirimkan ke ekspedisi lokal setelah pelunasan diverifikasi. Jika dalam waktu 14 hari barang tidak dilunasi tanpa kabar, maka DP dianggap hangus.
            </p>
          </section>

          <div className="border-t border-neutral-100 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-medium text-neutral-450 dark:text-zinc-500">
              Terakhir diperbarui: 14 Juli 2026
            </div>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
            >
              Tanya Hubungi WhatsApp
            </a>
          </div>
        </div>

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Identity */}
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-xs mt-1">
              Katalog HP terpercaya di Gresik. Transaksi aman, transparan, dan jaminan barang berkualitas.
            </p>
          </div>

          {/* Location & Address */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Lokasi Toko</span>
            <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed max-w-xs">
              {siteConfig.address}
            </p>
            <a
              href={siteConfig.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline mt-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Buka di Google Maps
            </a>
          </div>

          {/* Contact & Marketplaces */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Hubungi / Toko Online</span>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-zinc-400">WhatsApp Admin:</span>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 1: +62 895-1367-9939
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 2: +62 81-959-77777-0
                </a>
              </div>
              <div className="flex gap-3 items-center mt-1">
                <a
                  href={siteConfig.marketplaceLinks.shopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-orange-600 dark:text-orange-500 hover:underline"
                >
                  Shopee
                </a>
                <a
                  href={siteConfig.marketplaceLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 mt-8 pt-6 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
