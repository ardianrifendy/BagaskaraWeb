import React, { useEffect } from 'react';
import { detectTokopediaCategory } from '../../lib/kalkulator-tokopedia/detect';
import { getCategoryBySlug } from '../../lib/kalkulator-tokopedia/fees';

interface ProductInputTokopediaProps {
  name: string;
  categorySlug: string;
  onNameChange: (name: string) => void;
  onCategoryChange: (slug: string) => void;
  onOpenSelector: () => void;
  useTarifLama?: boolean;
  storeType: 'marketplace' | 'mall';
}

export const ProductInputTokopedia: React.FC<ProductInputTokopediaProps> = ({
  name,
  categorySlug,
  onNameChange,
  onCategoryChange,
  onOpenSelector,
  useTarifLama = false,
  storeType
}) => {
  const candidates = name ? detectTokopediaCategory(name) : [];
  const activeCategory = getCategoryBySlug(categorySlug, useTarifLama) as any;
  const activeRate = activeCategory.rateDinamis;

  const currentDefaultPlatformRate = storeType === 'mall'
    ? (activeCategory.ratePlatformMall ?? 10.0)
    : (activeCategory.ratePlatformMarketplace ?? 7.75);

  // Auto-select category teratas saat user mengetik nama/brand baru
  useEffect(() => {
    if (name && candidates.length > 0) {
      const topMatch = candidates[0].slug;
      if (topMatch !== categorySlug) {
        onCategoryChange(topMatch);
      }
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
      {/* Search Input Bar */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">APA YANG KAMU JUAL?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth. casing iphone 15 pro, laptop, tws, sepatu, baju..."
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-850 placeholder-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 font-extrabold"
        />
      </div>

      {/* Saran Kategori otomatis dari ketikan nama/brand */}
      {name && (
        <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Saran Kategori (Tap untuk pilih):</span>
          {candidates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidates.slice(0, 4).map((candidate) => {
                const isActive = candidate.slug === categorySlug;
                const candidatePlatRate = storeType === 'mall'
                  ? (candidate.ratePlatformMall ?? 10.0)
                  : (candidate.ratePlatformMarketplace ?? 7.75);

                return (
                  <button
                    key={candidate.slug}
                    type="button"
                    onClick={() => onCategoryChange(candidate.slug)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all font-extrabold cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}{candidate.nama} ({candidate.rateDinamis.toString().replace('.', ',')}%)
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onOpenSelector}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-neutral-300 text-emerald-600 font-extrabold hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer"
              >
                Ubah Manual...
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
              <span className="text-[11px] text-neutral-400 font-extrabold">Tidak ada saran otomatis untuk &quot;{name}&quot;</span>
              <button
                type="button"
                onClick={onOpenSelector}
                className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-emerald-600 font-extrabold transition-all cursor-pointer shadow-sm"
              >
                Pilih Manual
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Kategori Terpilih (Sangat Ringkas & Premium Button) */}
      <div className="flex items-center justify-between bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/60 gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider select-none">
            Kategori Terpilih
          </span>
          <div className="text-xs font-black text-neutral-800 uppercase tracking-tight truncate">
            {activeCategory?.nama || 'Tidak diketahui'}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            <span className="bg-emerald-50/60 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-100/50 select-none">
              Dinamis: {activeRate.toString().replace('.', ',')}%
            </span>
            <span className="bg-indigo-50/60 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-100/50 select-none">
              Platform: {currentDefaultPlatformRate.toString().replace('.', ',')}%
            </span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer select-none flex-shrink-0"
        >
          ✏️ Ubah
        </button>
      </div>
    </div>
  );
};
