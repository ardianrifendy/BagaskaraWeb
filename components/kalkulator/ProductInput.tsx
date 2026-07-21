import React from 'react';
import { detectCategory } from '@/lib/kalkulator/detect/detect';
import { CATEGORY_DICTIONARY, getShopeeGroupLabel } from '@/lib/kalkulator/detect/keywords';

interface ProductInputProps {
  name: string;
  categoryKey: string;
  onNameChange: (name: string) => void;
  onCategoryChange: (key: string) => void;
  onOpenSelector: () => void;
  sellerType: 'regular' | 'mall';
  size: 'biasa' | 'khusus';
}

export const ProductInputComponent: React.FC<ProductInputProps> = ({
  name,
  categoryKey,
  onNameChange,
  onCategoryChange,
  onOpenSelector,
  sellerType,
  size
}) => {
  // Jalankan deteksi kategori otomatis
  const candidates = name ? detectCategory(name) : [];
  const activeCategory = CATEGORY_DICTIONARY.find((c) => c.key === categoryKey);

  const activeRate = activeCategory
    ? (sellerType === 'mall' ? activeCategory.adminPct.mall : activeCategory.adminPct.regular)
    : 0;

  const goxRate = activeCategory
    ? (size === 'khusus' ? activeCategory.goxPct.khusus : activeCategory.goxPct.biasa)
    : 0;

  return (
    <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">APA YANG KAMU JUAL?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth. casing iphone 15 pro, laptop, tws, sepatu, baju..."
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-850 placeholder-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 font-extrabold"
        />
      </div>

      {/* Tampilan Deteksi Kategori */}
      {name && (
        <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Saran Kategori (Tap):</span>
          {candidates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidates.slice(0, 3).map((candidate) => {
                const isActive = candidate.key === categoryKey;
                return (
                  <button
                    key={candidate.key}
                    type="button"
                    onClick={() => onCategoryChange(candidate.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all font-extrabold cursor-pointer ${
                      isActive
                        ? 'bg-orange-55 border-orange-500 text-orange-600 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}{candidate.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onOpenSelector}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-neutral-300 text-orange-600 font-extrabold hover:border-orange-500 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Ubah Manual...
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-200/50">
              <span className="text-[11px] text-neutral-400 font-extrabold">Tidak ada saran kategori otomatis untuk &quot;{name}&quot;</span>
              <button
                type="button"
                onClick={onOpenSelector}
                className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-orange-600 font-extrabold transition-all cursor-pointer"
              >
                Pilih Manual
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Kategori Terpilih (Sama Persis Tokopedia Style) */}
      <div className="flex items-center justify-between bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/60 gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider select-none">
            Kategori Terpilih
          </span>
          <div className="text-xs font-black text-neutral-800 uppercase tracking-tight truncate">
            {activeCategory?.label || 'Tidak diketahui'}
          </div>
          {activeCategory && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              <span className="bg-orange-50/60 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-orange-100/50 select-none">
                Admin: {activeRate.toString().replace('.', ',')}%
              </span>
              <span className="bg-blue-50/60 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-blue-100/50 select-none">
                Gratis Ongkir XTRA: {goxRate.toString().replace('.', ',')}%
              </span>
              <span className="bg-neutral-200/60 text-neutral-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-neutral-300/50 select-none uppercase tracking-wider">
                Shopee {getShopeeGroupLabel(activeCategory.goxPct.biasa)}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-orange-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer select-none flex-shrink-0"
        >
          ✏️ Ubah
        </button>
      </div>
    </div>
  );
};
