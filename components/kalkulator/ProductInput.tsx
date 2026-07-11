import React from 'react';
import { detectCategory } from '@/lib/kalkulator/detect/detect';
import { CATEGORY_DICTIONARY } from '@/lib/kalkulator/detect/keywords';

interface ProductInputProps {
  name: string;
  categoryKey: string;
  onNameChange: (name: string) => void;
  onCategoryChange: (key: string) => void;
  onOpenSelector: () => void;
}

export const ProductInputComponent: React.FC<ProductInputProps> = ({
  name,
  categoryKey,
  onNameChange,
  onCategoryChange,
  onOpenSelector
}) => {
  // Jalankan deteksi kategori otomatis
  const candidates = name ? detectCategory(name) : [];
  const activeCategory = CATEGORY_DICTIONARY.find((c) => c.key === categoryKey);

  return (
    <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">APA YANG KAMU JUAL?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth. casing iphone 15 pro, laptop, tws..."
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
                        ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm'
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

      {/* Status kategori terpilih saat ini */}
      <div className="flex items-center justify-between text-xs bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80">
        <div>
          <span className="font-extrabold text-neutral-400">Kategori Terpilih: </span>
          <span className="font-black text-orange-600 uppercase">{activeCategory?.label || 'Tidak diketahui'}</span>
        </div>
        <button
          type="button"
          onClick={onOpenSelector}
          className="text-orange-600 font-extrabold hover:underline cursor-pointer"
        >
          [ubah]
        </button>
      </div>
    </div>
  );
};
