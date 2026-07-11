import React, { useState } from 'react';
import { CalcResult } from '@/lib/kalkulator/engine/types';
import { formatIDR } from '@/lib/kalkulator/format';

interface ResultPanelProps {
  result: CalcResult;
  suggestedPrice?: number;
  rawPrice?: number;
  mode: 'calculate' | 'reverse';
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  suggestedPrice,
  rawPrice,
  mode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ambil data breakdown
  const mainPrice = mode === 'reverse' ? (suggestedPrice || 0) : result.grossPrice;
  const isLoss = result.profit < 0;

  const handleCopy = () => {
    const textBreakdown = result.items
      .map(item => `- ${item.label}: ${formatIDR(item.amount)}${item.capped ? ' (maks)' : ''}`)
      .join('\n');
    
    const textToCopy = `=== RINCIAN POTONGAN SHOPEE ===
Mode: ${mode === 'reverse' ? 'Cari Harga Jual' : 'Cek Profit'}
Harga Jual: ${formatIDR(mainPrice)}
Diskon Seller: ${formatIDR(result.grossPrice - result.netPrice)}
--------------------------------
Rincian Biaya:
${textBreakdown}
--------------------------------
Net Diterima Seller: ${formatIDR(result.netReceived)}
Profit Bersih: ${formatIDR(result.profit)} (${result.marginPct}%)
================================
Kalkulasi via Bagaskara Cell Shopee Calculator`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white text-neutral-850 rounded-2xl shadow-md border border-neutral-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg">
      {/* Top Info */}
      <div className="p-5 flex flex-col gap-2 bg-gradient-to-br from-white to-neutral-50/30">
        <span className="text-[9px] text-orange-600 font-extrabold tracking-wider block uppercase select-none">
          {mode === 'reverse' ? 'REKOMENDASI HARGA JUAL' : 'HASIL BERSIH PENJUALAN'}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-black text-orange-600 tracking-tight">
            {formatIDR(mainPrice)}
          </span>
          {mode === 'reverse' && rawPrice && (
            <span className="text-xs text-neutral-400 font-bold select-none">
              mentah: {formatIDR(rawPrice)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs border-t border-neutral-100 pt-3 mt-1.5 font-extrabold">
          <span className="text-neutral-500">
            Net Diterima: <strong className="text-neutral-800 font-extrabold bg-neutral-100/60 px-1.5 py-0.5 rounded">{formatIDR(result.netReceived)}</strong>
          </span>
          <span className="text-neutral-300 select-none">·</span>
          <span className={`px-1.5 py-0.5 rounded ${isLoss ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'}`}>
            Profit: {formatIDR(result.profit)} ({result.marginPct}%)
          </span>
        </div>
      </div>

      {/* Accordion Rincian Waterfall */}
      <div className="border-t border-neutral-200 bg-neutral-50/20">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-3.5 text-left flex justify-between items-center text-[10px] font-black text-neutral-500 hover:bg-neutral-50/50 hover:text-neutral-800 transition-all outline-none uppercase tracking-wider cursor-pointer"
        >
          <span>RINCIAN POTONGAN ({result.items.length})</span>
          <span className="text-orange-600 font-extrabold">{isExpanded ? '▲ Sembunyikan' : '▼ Tampilkan Detail'}</span>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 flex flex-col gap-2.5 text-xs font-semibold text-neutral-600">
            <div className="flex justify-between border-b border-neutral-200 pb-2 mb-1">
              <span className="text-neutral-400 font-extrabold uppercase">Harga Jual</span>
              <span className="text-neutral-800 font-extrabold">{formatIDR(mainPrice)}</span>
            </div>

            {result.items.map((item, idx) => {
              const isMinus = !['packing', 'ads', 'insurance'].includes(item.key) && item.amount > 0;
              return (
                <div key={`${item.key}-${idx}`} className="flex justify-between items-center py-1 border-b border-dashed border-neutral-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={item.key === 'profit' ? 'font-black' : 'font-extrabold'}>{item.label}</span>
                    {item.capped && (
                      <span
                        className="bg-amber-50 border border-amber-200 text-amber-600 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider select-none"
                        title={`Kena batas maksimum (efektif ${item.effectivePct}% dari tarif ${item.ratePct}%)`}
                      >
                        maks
                      </span>
                    )}
                  </div>
                  <span className={`${isMinus ? 'text-rose-600 font-extrabold' : 'text-neutral-700'} ${item.key === 'profit' ? 'font-black text-orange-600 bg-orange-50/40 px-1 rounded' : ''}`}>
                    {isMinus ? '-' : ''}{formatIDR(item.amount)}
                  </span>
                </div>
              );
            })}

            <div className="flex justify-between border-t border-neutral-200 pt-3 mt-2 text-sm font-black text-neutral-900">
              <span>Dana Masuk (Saldo)</span>
              <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{formatIDR(result.netReceived)}</span>
            </div>

            {/* Clipboard Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 w-full py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/80 rounded-xl text-xs font-extrabold text-neutral-600 hover:text-orange-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
            >
              {copied ? '✓ Rincian Berhasil Disalin!' : '📋 Salin Rincian Teks'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

