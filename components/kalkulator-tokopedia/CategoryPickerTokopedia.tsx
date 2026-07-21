import React, { useState } from 'react';
import tarifData from '../../data/tarif/tokopedia-2026-05-18.json';
import { TokopediaCategory } from '../../lib/kalkulator-tokopedia/types';

interface CategoryPickerTokopediaProps {
  selectedSlug: string;
  onSelect: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
  useTarifLama?: boolean;
}

export const CategoryPickerTokopedia: React.FC<CategoryPickerTokopediaProps> = ({
  selectedSlug,
  onSelect,
  isOpen,
  onClose,
  useTarifLama = false
}) => {
  const [search, setSearch] = useState('');
  const [sortByRate, setSortByRate] = useState(false);

  if (!isOpen) return null;

  const categories: TokopediaCategory[] = tarifData.kategori.map((cat: any) => ({
    slug: cat.slug,
    nama: cat.nama,
    rateDinamis: useTarifLama ? cat.rateDinamisLama ?? cat.rateDinamis : cat.rateDinamis,
    rateDinamisLama: cat.rateDinamisLama ?? cat.rateDinamis,
    ratePlatformDefault: cat.ratePlatformDefault ?? null,
    ratePlatformMarketplace: cat.ratePlatformMarketplace,
    ratePlatformMall: cat.ratePlatformMall
  }));

  let filtered = categories.filter((cat) =>
    cat.nama.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (sortByRate) {
    filtered = [...filtered].sort((a, b) => a.rateDinamis - b.rateDinamis);
  } else {
    filtered = [...filtered].sort((a, b) => a.nama.localeCompare(b.nama));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] transition-all duration-300 border border-neutral-100/80 dark:border-zinc-800/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150 dark:border-zinc-850">
          <div>
            <h3 className="text-xs font-black tracking-wider text-neutral-800 dark:text-zinc-100 uppercase select-none">Pilih Kategori Produk</h3>
            <p className="text-[10px] text-neutral-400 dark:text-zinc-550 font-extrabold mt-0.5">30 Kategori Tokopedia &amp; TikTok Shop</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 text-xl p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search Box & Sort Toggle */}
        <div className="p-4 border-b border-neutral-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex flex-col gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori (misal: handphone, laptop, baju, sepatu...)"
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 dark:bg-zinc-850 border border-neutral-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 transition-all shadow-sm"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-550 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-550 hover:text-neutral-600 dark:hover:text-zinc-300 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-neutral-400 dark:text-zinc-500">{filtered.length} Kategori</span>
            <button
              type="button"
              onClick={() => setSortByRate(!sortByRate)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{sortByRate ? '🔤 Urutkan Alfabetis' : '🏷️ Urutkan Tarif Terendah'}</span>
            </button>
          </div>
        </div>

        {/* List Kategori */}
        <div className="overflow-y-auto p-4 flex flex-col gap-2 bg-neutral-50/50 dark:bg-zinc-950/20 flex-1">
          {filtered.length > 0 ? (
            filtered.map((cat) => {
              const isSelected = cat.slug === selectedSlug;
              const isLowest = cat.rateDinamis === 3.0;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    onSelect(cat.slug);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex justify-between items-center cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 text-neutral-700 dark:text-zinc-350 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-extrabold tracking-tight text-neutral-800 dark:text-zinc-150 flex items-center gap-2">
                      <span>{cat.nama}</span>
                      {isLowest && (
                        <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                          Tarif Turun 📉
                        </span>
                      )}
                    </div>
                    
                    {/* Tampilkan Tarif Tanpa Singkatan (User Awam Friendly) */}
                    <div className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-2.5 font-extrabold flex flex-wrap items-center gap-1.5">
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-350 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-neutral-200 dark:border-zinc-700 select-none">
                        Komisi Dinamis: {cat.rateDinamis.toString().replace('.', ',')}%
                      </span>
                      <span>·</span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-emerald-100/80 dark:border-emerald-900/30 select-none">
                        Power Merchant: {(cat.ratePlatformMarketplace || 7.5).toString().replace('.', ',')}%
                      </span>
                      <span>·</span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-indigo-100 dark:border-indigo-900/30 select-none">
                        Official Store: {(cat.ratePlatformMall || 10).toString().replace('.', ',')}%
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-xs md:text-sm text-neutral-400 dark:text-zinc-550 font-bold select-none">
              Kategori tidak ditemukan 🔍
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
