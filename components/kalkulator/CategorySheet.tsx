import React, { useState, useEffect } from 'react';
import { CATEGORY_DICTIONARY, getShopeeGroupLabel } from '@/lib/kalkulator/detect/keywords';

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKey: string;
  onSelect: (key: string) => void;
}

export const CategorySheet: React.FC<CategorySheetProps> = ({
  isOpen,
  onClose,
  selectedKey,
  onSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search query when sheet opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCategories = CATEGORY_DICTIONARY.filter(cat =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] transition-all duration-300 border border-neutral-100/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150">
          <h3 className="text-xs font-black tracking-wider text-neutral-800 uppercase select-none">Pilih Kategori Produk</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search Box */}
        <div className="p-4 border-b border-neutral-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kategori (misal: handphone, kaos, helm...)"
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 placeholder-neutral-400 transition-all shadow-sm"
            />
            {/* Search Icon */}
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List Kategori */}
        <div className="overflow-y-auto p-4 flex flex-col gap-2 bg-neutral-50/50 flex-1">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
              const isSelected = cat.key === selectedKey;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    onSelect(cat.key);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex justify-between items-center cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 text-orange-600 font-extrabold shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-sm font-extrabold tracking-tight text-neutral-800">{cat.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-extrabold flex items-center gap-1.5 flex-wrap">
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-500 px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border border-neutral-205/70 select-none">
                        Shopee {getShopeeGroupLabel(cat.goxPct.biasa)}
                      </span>
                      <span>·</span>
                      <span>Admin Reg: {cat.adminPct.regular}%</span>
                      <span>·</span>
                      <span>Mall: {cat.adminPct.mall}%</span>
                      <span>·</span>
                      <span>GOX: {cat.goxPct.biasa}%</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="h-5 w-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm shadow-orange-200">
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
