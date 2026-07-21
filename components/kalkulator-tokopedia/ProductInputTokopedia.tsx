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
}

export const ProductInputTokopedia: React.FC<ProductInputTokopediaProps> = ({
  name,
  categorySlug,
  onNameChange,
  onCategoryChange,
  onOpenSelector,
  useTarifLama = false
}) => {
  const candidates = name ? detectTokopediaCategory(name) : [];
  const activeCategory = getCategoryBySlug(categorySlug, useTarifLama);
  const activeRate = activeCategory.rateDinamis;

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
      {/* Search Input Bar (Identik dengan Shopee) */}
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

      {/* Status Kategori Terpilih (Identik Layout Shopee) */}
      <div className="flex items-center justify-between text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-extrabold text-neutral-400">Kategori Terpilih: </span>
          <span className="font-black text-emerald-600 uppercase">{activeCategory?.nama || 'Tidak diketahui'}</span>
          <span className="bg-emerald-100 text-[10px] font-black text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 select-none">
            Dinamis {activeRate.toString().replace('.', ',')}%
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSelector}
          className="text-emerald-600 font-extrabold hover:underline cursor-pointer flex-shrink-0"
        >
          [ubah]
        </button>
      </div>
    </div>
  );
};
