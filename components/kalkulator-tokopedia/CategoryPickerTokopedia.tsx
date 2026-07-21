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

  const categories: TokopediaCategory[] = tarifData.kategori.map((cat) => ({
    slug: cat.slug,
    nama: cat.nama,
    rateDinamis: useTarifLama ? cat.rateDinamisLama ?? cat.rateDinamis : cat.rateDinamis,
    rateDinamisLama: cat.rateDinamisLama ?? cat.rateDinamis,
    ratePlatformDefault: cat.ratePlatformDefault
  }));

  let filtered = categories.filter((cat) =>
    cat.nama.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (sortByRate) {
    filtered = [...filtered].sort((a, b) => a.rateDinamis - b.rateDinamis);
  } else {
    filtered = [...filtered].sort((a, b) => a.nama.localeCompare(a.nama));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] border border-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-black text-neutral-850 uppercase tracking-wider">Pilih Kategori Induk</h3>
            <p className="text-[10px] text-neutral-400 font-extrabold mt-0.5">30 Kategori Resmi Tokopedia &amp; TikTok Shop</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-neutral-100 flex flex-col gap-3 bg-white">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori (misal: handphone, baju, koper, sepatu...)"
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs md:text-sm font-extrabold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
              {filtered.length} Kategori Ditemukan
            </span>
            <button
              type="button"
              onClick={() => setSortByRate(!sortByRate)}
              className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{sortByRate ? '🔤 Urutkan Alfabetis' : '🏷️ Urutkan Tarif Terendah'}</span>
            </button>
          </div>
        </div>

        {/* Grid List */}
        <div className="overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-neutral-50/50 flex-1">
          {filtered.map((cat) => {
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
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700 hover:shadow-sm'
                }`}
              >
                <div className="text-xs font-black leading-snug line-clamp-2">{cat.nama}</div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      isLowest
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {cat.rateDinamis.toString().replace('.', ',')}%
                  </span>
                  {isLowest && (
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-tight">TURUN 📉</span>
                  )}
                  {isSelected && (
                    <span className="text-xs font-black text-emerald-600">✓</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
