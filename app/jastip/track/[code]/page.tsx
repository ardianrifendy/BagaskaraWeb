import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbJastip } from "@/lib/db-jastip";
import { orders } from "@/database/schema-jastip";
import { eq } from "drizzle-orm";
import { normalizeOrderCode } from "@/lib/jastip/order-code";
import { formatRupiah } from "@/lib/formatRupiah";
import Logo from "@/components/Logo";
import JastipItemsList from "@/components/jastip/JastipItemsList";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pelacakan Order Jastip — Bagaskara Cell",
  description: "Lacak status rincian order jasa titip Anda secara real-time.",
  robots: {
    index: false, // JANGAN di-index oleh mesin pencari
    follow: false,
  },
};

// Masking helpers
function maskWaNumber(wa: string): string {
  let clean = wa.replace(/[^0-9]/g, "");
  if (clean.startsWith("62")) {
    clean = "0" + clean.substring(2);
  }
  if (clean.length >= 10) {
    const part1 = clean.substring(0, 4);
    const part2 = clean.substring(4, 6);
    return `${part1}-${part2}XX-XXXX`;
  }
  return "08XX-XXXX-XXXX";
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return name;
  }
  return `${parts[0]} ${parts[1][0]}.`;
}

// Timeline state calculation
function getOrderStep(order: any): number {
  const items = order.items || [];
  const statusList = items.map((i: any) => i.status);

  const allDone =
    items.length > 0 &&
    items.every((i: any) => ["shipped", "out_of_stock", "cancelled"].includes(i.status));

  if (order.paymentStatus === "paid" && allDone) {
    return 5;
  }

  if (order.resi || statusList.includes("shipped")) {
    return 4;
  }

  if (statusList.includes("warehouse")) {
    return 3;
  }

  const activeStatuses = ["hunting", "found", "purchased"];
  if (statusList.some((s: string) => activeStatuses.includes(s))) {
    return 2;
  }

  return 1;
}

interface TrackPageProps {
  params: Promise<{ code: string }>;
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { code } = await params;
  const normalizedCode = normalizeOrderCode(code);

  // Fetch data directly in Server Component
  const orderData = await dbJastip.query.orders.findFirst({
    where: eq(orders.code, normalizedCode),
    with: {
      batch: true,
      items: true,
      payments: true,
    },
  });

  if (!orderData) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-xl text-center space-y-6">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-black text-neutral-800 dark:text-white">Order Tidak Ditemukan</h1>
          <p className="text-xs md:text-sm text-neutral-450 dark:text-zinc-500 leading-relaxed">
            Kode order <strong className="text-neutral-700 dark:text-zinc-300 font-extrabold">{normalizedCode}</strong> tidak terdaftar di sistem kami.
            Periksa kembali format kodenya (contoh: JST-7KQ2-M9XD) atau hubungi admin via WhatsApp.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/jastip"
              className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow"
            >
              Coba Lacak Lagi
            </Link>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo, saya ingin menanyakan kode order jastip saya yang tidak terdaftar.`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 border border-neutral-200 dark:border-zinc-700 hover:border-neutral-450 text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150"
            >
              Hubungi CS WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Mask details for public view
  const maskedName = maskName(orderData.customerName);
  const maskedWa = maskWaNumber(orderData.customerWa);
  const currentStep = getOrderStep(orderData);

  // Billing Math
  let totalCostIdr = 0;
  for (const item of orderData.items) {
    const isZero = ["cancelled", "out_of_stock"].includes(item.status);
    if (isZero) continue;

    const estPriceNum = Number(item.estPrice) || 0;
    const actualPriceNum = item.actualPrice !== null ? Number(item.actualPrice) : null;
    const rate = Number(orderData.batch.exchangeRate) || 0;
    const val = Number(orderData.batch.feeValue) || 0;

    const finalItemPrice = actualPriceNum !== null ? actualPriceNum : estPriceNum;
    const baseIdr = finalItemPrice * rate * item.qty;
    const feeIdr = orderData.batch.feeType === "percent" ? baseIdr * (val / 100) : val * item.qty;

    totalCostIdr += baseIdr + feeIdr;
  }

  const totalPaidIdr = orderData.payments.reduce((acc, p) => acc + Number(p.amountIdr), 0);
  const sisaIdr = totalCostIdr - totalPaidIdr;
  const isLunas = sisaIdr <= 0;

  // Timeline Steps definitions
  const steps = [
    { label: "Order Masuk", desc: "Pesanan terdaftar di sistem", active: currentStep >= 1 },
    { label: "Dibelanjakan", desc: "Barang sedang dibeli di luar negeri", active: currentStep >= 2 },
    { label: "Tiba di Gudang", desc: "Barang sampai di Gresik", active: currentStep >= 3 },
    { label: "Dikirim", desc: "Barang dikirim ke alamat Anda", active: currentStep >= 4 },
    { label: "Selesai", desc: "Pelunasan selesai & barang diterima", active: currentStep >= 5 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/jastip"
            className="text-xs font-black text-neutral-500 dark:text-zinc-450 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
          >
            Lacak Baru
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col gap-6">

        {/* Order Header Card */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-zinc-800/80 pb-4">
            <div>
              <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block">
                Kode Order
              </span>
              <h1 className="text-xl md:text-2xl font-black text-neutral-850 dark:text-zinc-150 tracking-tight">
                {orderData.code}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 text-xs font-bold border border-neutral-200 dark:border-zinc-700 uppercase">
                {orderData.batch.name}
              </span>
              {orderData.paymentStatus === "paid" ? (
                <span className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-black uppercase tracking-wider">
                  Lunas
                </span>
              ) : orderData.paymentStatus === "dp" ? (
                <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-850 border border-orange-200 text-xs font-black uppercase tracking-wider">
                  DP Masuk
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-red-150 text-red-850 border border-red-200 text-xs font-black uppercase tracking-wider">
                  Belum Bayar
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <span className="text-[9px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block">
                Pelanggan (Samaran)
              </span>
              <span className="font-extrabold text-neutral-800 dark:text-zinc-200">{maskedName}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block">
                No. WhatsApp CS
              </span>
              <span className="font-extrabold text-neutral-800 dark:text-zinc-200">{maskedWa}</span>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider mb-5">
            Garis Waktu Pesanan
          </h3>
          <div className="relative flex flex-col md:flex-row justify-between gap-6">
            {/* Timeline Line (desktop only) */}
            <div className="absolute top-4.5 left-0 right-0 h-0.5 bg-neutral-100 dark:bg-zinc-850 hidden md:block z-0" />

            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex md:flex-col items-start md:items-center gap-4 md:gap-2.5 flex-1 relative z-10"
              >
                {/* Step Circle */}
                <div
                  className={`w-9.5 h-9.5 rounded-full flex items-center justify-center font-black text-sm transition-all border ${
                    step.active
                      ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-900/10"
                      : "bg-white dark:bg-zinc-900 text-neutral-400 border-neutral-200 dark:border-zinc-800"
                  }`}
                >
                  {step.active ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="flex flex-col md:items-center md:text-center gap-0.5">
                  <span
                    className={`text-xs md:text-sm font-black transition-colors ${
                      step.active ? "text-neutral-850 dark:text-zinc-150" : "text-neutral-400 dark:text-zinc-650"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-zinc-550 leading-tight max-w-[130px]">
                    {step.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 dark:divide-zinc-800/80">
          <div>
            <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              Total Tagihan
            </span>
            <span className="text-lg font-black text-neutral-800 dark:text-zinc-200">
              {formatRupiah(totalCostIdr)}
            </span>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              Sudah Dibayar
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-450">
              {formatRupiah(totalPaidIdr)}
            </span>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              Sisa Tagihan
            </span>
            <span
              className={`text-xl font-black ${
                isLunas ? "text-emerald-600 dark:text-emerald-450" : "text-orange-600 dark:text-orange-455"
              }`}
            >
              {isLunas ? "LUNAS ✅" : formatRupiah(sisaIdr)}
            </span>
          </div>
        </div>

        {/* Items List */}
        <JastipItemsList
          items={orderData.items}
          exchangeRate={Number(orderData.batch.exchangeRate)}
          feeType={orderData.batch.feeType}
          feeValue={Number(orderData.batch.feeValue)}
        />

        {/* Riwayat Pembayaran */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
            Riwayat Pembayaran
          </h3>

          {orderData.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-zinc-800/85 text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-550">
                    <th className="pb-2">Tanggal</th>
                    <th className="pb-2">Nominal</th>
                    <th className="pb-2">Tipe</th>
                    <th className="pb-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-zinc-850/20 text-neutral-700 dark:text-zinc-350">
                  {orderData.payments.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="py-2.5 font-bold">{p.paidAt}</td>
                      <td className="py-2.5 font-black text-neutral-850 dark:text-zinc-150">
                        {formatRupiah(Number(p.amountIdr))}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                            p.type === "dp"
                              ? "bg-orange-50 text-orange-700 border border-orange-200/50"
                              : p.type === "refund"
                              ? "bg-red-50 text-red-700 border border-red-200/50"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-neutral-450 dark:text-zinc-500 font-medium italic">
                        {p.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-xs font-bold text-neutral-400 dark:text-zinc-550">
              Belum ada riwayat pembayaran yang dicatat.
            </div>
          )}
        </div>

        {/* Resi & Kurir Info */}
        {orderData.resi && (
          <div className="p-5 rounded-3xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block">
                Pengiriman Lokal (Kurir)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-neutral-800 dark:text-zinc-200">
                  {orderData.resi}
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 border text-neutral-500">
                  {orderData.courier || "Ekspedisi"}
                </span>
              </div>
            </div>
            <Link
              href={`/cek-resi?courier=${encodeURIComponent(
                orderData.courier || ""
              )}&awb=${encodeURIComponent(orderData.resi)}`}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
            >
              Lacak di /cek-resi
            </Link>
          </div>
        )}

        {/* CTA WA / S&K */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <Link
            href="/jastip/ketentuan"
            className="text-xs font-extrabold text-orange-600 dark:text-orange-450 hover:underline cursor-pointer"
          >
            Baca Ketentuan Jastip & S&K
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo, saya ingin menanyakan perkembangan order jastip saya dengan kode ${orderData.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow transition-colors cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
            </svg>
            Tanya Admin via WhatsApp
          </a>
        </div>

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 pt-6 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
