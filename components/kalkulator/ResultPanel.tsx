import React, { useState, useEffect } from 'react';
import { CalcResult } from '@/lib/kalkulator/engine/types';
import { formatIDR } from '@/lib/kalkulator/format';

interface ResultPanelProps {
  result: CalcResult;
  suggestedPrice?: number;
  rawPrice?: number;
  mode: 'calculate' | 'reverse';
  productName?: string;
}

const formatWhatsAppNumber = (num: string): string => {
  let cleaned = num.replace(/\D/g, ''); // hapus karakter non-digit
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  suggestedPrice,
  rawPrice,
  mode,
  productName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNo, setPhoneNo] = useState('');
  const [inputPhone, setInputPhone] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = window.localStorage.getItem('shopee_calc_user_phone') || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhoneNo(savedPhone);
      setInputPhone(savedPhone);
    }
  }, []);

  const sendWhatsApp = (targetNum: string) => {
    const textBreakdown = result.items
      .map(item => `\u{25AA}\u{FE0F} *${item.label}:* ${formatIDR(item.amount)}${item.capped ? ' _(maks)_' : ''}`)
      .join('\n');
    
    const textToCopy = `\u{1F4F1} *RINCIAN POTONGAN SHOPEE* \u{1F4F1}
-----------------------------------------------
\u{1F4E6} *Produk:* ${productName || 'Produk Tanpa Nama'}
\u{2696}\u{FE0F} *Mode:* ${mode === 'reverse' ? '\u{1F3AF} Cari Harga Jual' : '\u{1F50D} Cek Profit'}
\u{1F4B0} *Harga Jual:* *${formatIDR(mainPrice)}*
\u{1F3F7}\u{FE0F} *Diskon Seller:* ${formatIDR(result.grossPrice - result.netPrice)}
-----------------------------------------------
\u{1F4B8} *RINCIAN BIAYA POTONGAN:*
${textBreakdown}
-----------------------------------------------
\u{1F4E5} *Net Diterima Seller:* *${formatIDR(result.netReceived)}*
\u{1F4C8} *Profit Bersih:* *${formatIDR(result.profit)}* (${result.marginPct}%)
===============================
\u{1F680} _Kalkulasi via Bagaskara Cell Shopee Calculator_`;

    const cleanNum = formatWhatsAppNumber(targetNum);
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textToCopy)}`;
    window.open(waUrl, '_blank');
  };

  const handleWhatsAppClick = () => {
    if (phoneNo) {
      sendWhatsApp(phoneNo);
    } else {
      setShowPhoneInput(!showPhoneInput);
    }
  };

  const submitWhatsApp = () => {
    if (!inputPhone.trim()) return;
    const cleanNum = formatWhatsAppNumber(inputPhone);
    setPhoneNo(cleanNum);
    window.localStorage.setItem('shopee_calc_user_phone', cleanNum);
    setShowPhoneInput(false);
    sendWhatsApp(cleanNum);
  };

  // Ambil data breakdown
  const mainPrice = mode === 'reverse' ? (suggestedPrice || 0) : result.grossPrice;
  const isLoss = result.profit < 0;

  const handleCopy = () => {
    const textBreakdown = result.items
      .map(item => `\u{25AA}\u{FE0F} *${item.label}:* ${formatIDR(item.amount)}${item.capped ? ' _(maks)_' : ''}`)
      .join('\n');
    
    const textToCopy = `\u{1F4F1} *RINCIAN POTONGAN SHOPEE* \u{1F4F1}
-----------------------------------------------
\u{1F4E6} *Produk:* ${productName || 'Produk Tanpa Nama'}
\u{2696}\u{FE0F} *Mode:* ${mode === 'reverse' ? '\u{1F3AF} Cari Harga Jual' : '\u{1F50D} Cek Profit'}
\u{1F4B0} *Harga Jual:* *${formatIDR(mainPrice)}*
\u{1F3F7}\u{FE0F} *Diskon Seller:* ${formatIDR(result.grossPrice - result.netPrice)}
-----------------------------------------------
\u{1F4B8} *RINCIAN BIAYA POTONGAN:*
${textBreakdown}
-----------------------------------------------
\u{1F4E5} *Net Diterima Seller:* *${formatIDR(result.netReceived)}*
\u{1F4C8} *Profit/Margin:* *${formatIDR(result.profit)}* (${result.marginPct}%)
===============================
\u{1F680} _Kalkulasi via Bagaskara Cell Shopee Calculator_`;

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

      {/* Premium Explanation Box */}
      <div className="mx-5 mb-5 p-3.5 bg-orange-50/45 dark:bg-orange-950/10 border border-orange-100/70 dark:border-orange-900/20 rounded-2xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-350">
        💡 <strong className="text-neutral-800 dark:text-neutral-200">Kesimpulan Toko:</strong>{' '}
        {mode === 'reverse' ? (
          <>
            Untuk mendapat untung bersih <span className="font-extrabold text-orange-600">{formatIDR(result.profit)}</span>, harga jual pasnya adalah <span className="font-semibold">{formatIDR(rawPrice || mainPrice)}</span>{rawPrice && rawPrice !== mainPrice ? <>, dibulatkan menjadi <span className="font-extrabold text-orange-600">{formatIDR(mainPrice)}</span> agar lebih menarik bagi pembeli (angka cantik)</> : ''}. Total potongan biaya/iklan Shopee adalah <span className="font-extrabold text-rose-600">{formatIDR(result.totalFees)}</span>.
          </>
        ) : (
          <>
            Jika Anda menjual seharga <span className="font-extrabold text-orange-600">{formatIDR(mainPrice)}</span>, uang bersih yang akan masuk ke saldo toko Anda adalah <span className="font-extrabold text-emerald-600">{formatIDR(result.netReceived)}</span> setelah dikurangi potongan Shopee &amp; iklan sebesar <span className="font-extrabold text-rose-600">{formatIDR(result.totalFees)}</span>.
          </>
        )}
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
              className="mt-3 w-full py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-355 hover:bg-neutral-100/80 rounded-xl text-xs font-extrabold text-neutral-600 hover:text-orange-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
            >
              {copied ? '✓ Rincian Berhasil Disalin!' : '📋 Salin Rincian Teks'}
            </button>

            {/* WhatsApp Send Button */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
                >
                  💬 {phoneNo ? `Kirim ke WA Saya (${phoneNo})` : 'Kirim Catatan ke WA'}
                </button>
                {phoneNo && (
                  <button
                    type="button"
                    onClick={() => setShowPhoneInput(!showPhoneInput)}
                    className="px-3 bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Ubah Nomor WhatsApp"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {showPhoneInput && (
                <div className="mt-2.5 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/70 dark:border-emerald-900/20 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-350 uppercase tracking-wide">Masukkan Nomor WhatsApp Anda:</span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="flex-1 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={submitWhatsApp}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-450 dark:text-zinc-550 font-bold">*Nomor disimpan di browser untuk kalkulasi berikutnya.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

