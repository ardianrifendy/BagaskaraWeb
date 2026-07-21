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
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] transition-all duration-300 border border-neutral-100/80 overflow-hidden">
        {/* Header (Identik Shopee CategorySheet) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150">
          <div>
            <h3 className="text-xs font-black tracking-wider text-neutral-800 uppercase select-none">Pilih Kategori Produk</h3>
            <p className="text-[10px] text-neutral-400 font-extrabold mt-0.5">30 Kategori Tokopedia &amp; TikTok Shop</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search Box & Sort Toggle */}
        <div className="p-4 border-b border-neutral-100 bg-white flex flex-col gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori (misal: handphone, laptop, baju, sepatu...)"
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 placeholder-neutral-400 transition-all shadow-sm"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-neutral-400">{filtered.length} Kategori</span>
            <button
              type="button"
              onClick={() => setSortByRate(!sortByRate)}
              className="text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{sortByRate ? '🔤 Urutkan Alfabetis' : '🏷️ Urutkan Tarif Terendah'}</span>
            </button>
          </div>
        </div>

        {/* List Kategori (Identik Shopee Style) */}
        <div className="overflow-y-auto p-4 flex flex-col gap-2 bg-neutral-50/50 flex-1">
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
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-700 font-extrabold shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-sm font-extrabold tracking-tight text-neutral-800 flex items-center gap-2">
                      <span>{cat.nama}</span>
                      {isLowest && (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                          Tarif Turun 📉
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-extrabold flex items-center gap-1.5 flex-wrap">
                      <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-neutral-200">
                        Dinamis: {cat.rateDinamis.toString().replace('.', ',')}%
                      </span>
                      <span>·</span>
                      <span>Cap Max: Rp 650.000 / item</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-xs md:text-sm text-neutral-400 font-bold select-none">
              Kategori tidak ditemukan 🔍
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
