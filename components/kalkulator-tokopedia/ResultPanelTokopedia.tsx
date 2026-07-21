import React, { useState } from 'react';
import { TokopediaCalcResult } from '../../lib/kalkulator-tokopedia/types';
import { formatIDR } from '../../lib/kalkulator/format';

interface ResultPanelTokopediaProps {
  result: TokopediaCalcResult;
  suggestedPrice?: number;
  rawPrice?: number;
  mode: 'calculate' | 'reverse';
  shareUrl?: string;
  categoryName?: string;
  isEmpty?: boolean;
}

export const ResultPanelTokopedia: React.FC<ResultPanelTokopediaProps> = ({
  result,
  suggestedPrice,
  rawPrice,
  mode,
  shareUrl,
  categoryName,
  isEmpty = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default terbuka agar user langsung melihat rincian
  const [copied, setCopied] = useState(false);

  if (isEmpty) {
    return (
      <div className="bg-white text-neutral-850 rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
          💡
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
            {mode === 'reverse' ? 'REKOMENDASI HARGA JUAL' : 'HASIL BERSIH PENJUALAN'}
          </span>
          <p className="text-xs text-neutral-500 font-medium max-w-xs leading-relaxed">
            Masukkan nilai <strong className="text-neutral-700">Modal / HPP</strong> dan{' '}
            <strong className="text-neutral-700">{mode === 'reverse' ? 'Target Profit' : 'Harga Jual'}</strong> di formulir sebelah kiri untuk melihat hasil kalkulasi otomatis.
          </p>
        </div>
        <div className="mt-2 text-2xl font-black text-neutral-300">
          Rp 0
        </div>
      </div>
    );
  }

  const mainPrice = mode === 'reverse' ? (suggestedPrice || 0) : result.grossPrice;
  const isLoss = result.profit < 0;

  const hasPlatformCommission = result.items.some((i) => i.key === 'komisi_platform');
  const hasLogisticsFee = result.items.some((i) => i.key === 'biaya_logistik');

  const handleCopy = () => {
    const textBreakdown = result.items
      .map((item) => {
        let suffix = '';
        if (item.capped) suffix = ' _(cap Rp650k)_';
        if (item.key === 'biaya_logistik' && result.totalBillableWeight) {
          suffix += ` _(${result.totalBillableWeight.toFixed(2)} kg)_`;
        }
        return `▪️ *${item.label}:* ${formatIDR(item.amount)}${suffix}`;
      })
      .join('\n');

    const fullUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const textToCopy = `🟢 *KALKULATOR TOKOPEDIA & TIKTOK SHOP* 🟢
-----------------------------------------------
📦 *Kategori:* ${categoryName || 'Umum'}
🎯 *Mode:* ${mode === 'reverse' ? 'Cari Harga Jual' : 'Cek Profit'}
💰 *Harga Jual:* *${formatIDR(mainPrice)}*
-----------------------------------------------
💸 *RINCIAN POTONGAN BIAYA:*
${textBreakdown}
-----------------------------------------------
📥 *Net Diterima Seller:* *${formatIDR(result.netReceived)}*
📈 *Profit Bersih:* *${formatIDR(result.profit)}* (${result.marginPct}%)
==============================
🔗 Hitung sendiri di: ${fullUrl}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  return (
    <div className="bg-white text-neutral-850 rounded-2xl shadow-md border border-neutral-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg">
      {/* Top Info */}
      <div className="p-5 flex flex-col gap-2 bg-gradient-to-br from-white to-emerald-50/20">
        <span className="text-[9px] text-emerald-600 font-extrabold tracking-wider block uppercase select-none">
          {mode === 'reverse' ? 'REKOMENDASI HARGA JUAL' : 'HASIL BERSIH PENJUALAN'}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-black text-emerald-600 tracking-tight">
            {formatIDR(mainPrice)}
          </span>
          {mode === 'reverse' && rawPrice && rawPrice !== mainPrice && (
            <span className="text-xs text-neutral-400 font-bold select-none">
              mentah: {formatIDR(rawPrice)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs border-t border-neutral-100 pt-3 mt-1.5 font-extrabold">
          <span className="text-neutral-500">
            Net Diterima: <strong className="text-neutral-800 font-extrabold bg-neutral-100/70 px-1.5 py-0.5 rounded">{formatIDR(result.netReceived)}</strong>
          </span>
          <span className="text-neutral-300 select-none">·</span>
          <span className={`px-1.5 py-0.5 rounded ${isLoss ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'}`}>
            Profit: {formatIDR(result.profit)} ({result.marginPct}%)
          </span>
        </div>
      </div>

      {/* Narasi Kesimpulan */}
      <div className="mx-5 mb-5 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-[11px] leading-relaxed text-neutral-600">
        💡 <strong className="text-neutral-800">Kesimpulan Tokopedia / TikTok Shop:</strong>{' '}
        {mode === 'reverse' ? (
          <>
            Untuk mendapat untung bersih <span className="font-extrabold text-emerald-600">{formatIDR(result.profit)}</span>, rekomendasi harga jual adalah <span className="font-extrabold text-emerald-600">{formatIDR(mainPrice)}</span>. Total potongan biaya admin &amp; komisi adalah <span className="font-extrabold text-rose-600">{formatIDR(result.totalFees)}</span>.
          </>
        ) : (
          <>
            Jika dijual seharga <span className="font-extrabold text-emerald-600">{formatIDR(mainPrice)}</span>, saldo bersih yang masuk ke toko Anda adalah <span className="font-extrabold text-emerald-600">{formatIDR(result.netReceived)}</span> setelah dikurangi total potongan <span className="font-extrabold text-rose-600">{formatIDR(result.totalFees)}</span>.
          </>
        )}
      </div>

      {/* Rincian Potongan Accordion */}
      <div className="border-t border-neutral-200 bg-neutral-50/20">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-3.5 text-left flex justify-between items-center text-[10px] font-black text-neutral-500 hover:bg-neutral-50/50 hover:text-neutral-800 transition-all outline-none uppercase tracking-wider cursor-pointer"
        >
          <span>RINCIAN POTONGAN ({result.items.length})</span>
          <span className="text-emerald-600 font-extrabold">{isExpanded ? '▲ Sembunyikan' : '▼ Tampilkan Detail'}</span>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 flex flex-col gap-2 text-xs font-semibold text-neutral-600">
            <div className="flex justify-between border-b border-neutral-200 pb-2 mb-1">
              <span className="text-neutral-400 font-extrabold uppercase">Harga Jual Gross</span>
              <span className="text-neutral-800 font-extrabold">{formatIDR(mainPrice)}</span>
            </div>

            {result.items.map((item, idx) => {
              const isDiscount = item.amount < 0;
              return (
                <div key={`${item.key}-${idx}`} className="flex justify-between items-center py-1 border-b border-dashed border-neutral-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold">{item.label}</span>
                    {item.capped && (
                      <span className="bg-sky-50 border border-sky-200 text-sky-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        cap 650k
                      </span>
                    )}
                    {item.key === 'biaya_logistik' && result.totalBillableWeight && (
                      <span className="bg-neutral-100 text-neutral-600 text-[9px] px-1.5 py-0.5 rounded font-black">
                        {result.totalBillableWeight.toFixed(2)} kg
                      </span>
                    )}
                  </div>
                  <span className={isDiscount ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                    {isDiscount ? '' : '-'}{formatIDR(Math.abs(item.amount))}
                  </span>
                </div>
              );
            })}

            {/* Petunjuk Tambahan Jika Komisi Platform / Biaya Logistik Belum Diisi */}
            {!hasPlatformCommission && (
              <div className="py-1 flex justify-between text-[11px] text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span>➕ Komisi Platform Toko (7,75%)</span>
                <span className="font-extrabold">Isi di Opsi Lanjutan</span>
              </div>
            )}
            {result.isLogisticUnavailable && (
              <div className="py-1 flex justify-between text-[11px] text-rose-700 bg-rose-50/60 p-2 rounded-lg border border-rose-100 font-bold animate-pulse">
                <span>⚠️ Biaya Layanan Logistik (N.A.)</span>
                <span className="font-extrabold">Layanan tidak tersedia</span>
              </div>
            )}
            {!hasLogisticsFee && !result.isLogisticUnavailable && (
              <div className="py-1 flex justify-between text-[11px] text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span>➕ Biaya Layanan Logistik (Rp 1.520)</span>
                <span className="font-extrabold">Isi di Opsi Lanjutan</span>
              </div>
            )}

            <div className="flex justify-between border-t border-neutral-200 pt-3 mt-2 text-sm font-black text-neutral-900">
              <span>Dana Masuk (Saldo)</span>
              <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{formatIDR(result.netReceived)}</span>
            </div>

            {/* Tombol Copy & Share */}
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm uppercase tracking-wider"
            >
              {copied ? '✓ Hasil & Link Berhasil Disalin!' : '📋 Salin Hasil & Bagikan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
