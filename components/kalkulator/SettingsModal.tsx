"use client";

import React, { useState, useEffect, useRef } from 'react';
import { StoreProfile, SellerType } from '@/lib/kalkulator/engine/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StoreProfile;
  onChange: (updated: StoreProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onChange
}) => {
  const [localProfile, setLocalProfile] = useState<StoreProfile>(profile);
  const [spaylaterDropdownOpen, setSpaylaterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalProfile(profile);
    }
  }, [isOpen, profile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSpaylaterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof StoreProfile, val: unknown) => {
    setLocalProfile(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSave = () => {
    onChange(localProfile);
    onClose();
  };

  const spaylaterOptions = [
    { label: 'Abaikan SPayLater (0%)', value: 'off' },
    { label: 'Hitung Penuh (Worst Case)', value: 'worst' },
    { label: 'Estimasi Proporsi Pembeli', value: 'estimate' }
  ];

  const activeSpaylaterOption = spaylaterOptions.find(opt => opt.value === localProfile.spaylaterMode) || spaylaterOptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 border border-neutral-100 overflow-hidden text-neutral-850 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150 bg-neutral-50/50">
          <div>
            <h3 className="text-xs font-black tracking-wider text-neutral-850 uppercase select-none">Pengaturan Toko & Operasional</h3>
            <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-0.5 select-none">Default biaya & program toko Anda</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4 bg-neutral-50/30">
          {/* Tipe Penjual */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-2.5">
            <label className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider select-none">TIPE TOKO</label>
            <div className="grid grid-cols-2 gap-2">
              {(['regular', 'mall'] as SellerType[]).map((type) => {
                const isActive = localProfile.sellerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('sellerType', type)}
                    className={`py-2.5 rounded-xl border font-black text-xs transition-all uppercase tracking-wider cursor-pointer ${
                      isActive
                        ? 'border-orange-500 bg-orange-50/70 text-orange-600 shadow-sm shadow-orange-100'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-500 bg-neutral-50/10'
                    }`}
                  >
                    {type === 'regular' ? 'Reguler / Star / Star+' : 'Shopee Mall'}
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] text-neutral-400 font-extrabold leading-normal select-none">
              * Tarif admin Star/Star+ sama dengan Star seller dalam kategori yang sama.
            </span>
          </div>

          {/* Toko Baru */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-neutral-800 block">Toko Baru (&lt;50 pesanan)</span>
              <span className="text-[9px] text-neutral-450 mt-0.5 block font-extrabold">Bebas biaya admin dasar &amp; proses pesanan</span>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('isNewStore', !localProfile.isNewStore)}
              className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localProfile.isNewStore ? 'bg-orange-600' : 'bg-neutral-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localProfile.isNewStore ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Biaya default operasional */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3.5">
            <label className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider select-none">BIAYA OPERASIONAL &amp; IKLAN</label>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Biaya Proses Pesanan Shopee (Rp)</label>
              <input
                type="number"
                value={localProfile.orderProcessingFee}
                onChange={(e) => handleInputChange('orderProcessingFee', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 font-bold transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Packing (Rp/pesanan)</label>
                <input
                  type="number"
                  value={localProfile.packingCost}
                  onChange={(e) => handleInputChange('packingCost', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 font-bold transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Iklan Shopee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localProfile.adCostPct}
                  onChange={(e) => handleInputChange('adCostPct', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 font-bold transition-all"
                />
              </div>
            </div>
          </div>

          {/* SPayLater Settings */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3.5">
            <label className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider select-none">BIAYA SPAYLATER (DITANGGUNG PENJUAL)</label>

            {/* Custom Dropdown for SPayLater Mode */}
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
              <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Mode SPayLater</label>
              <button
                type="button"
                onClick={() => setSpaylaterDropdownOpen(!spaylaterDropdownOpen)}
                className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 rounded-xl px-3.5 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all flex items-center justify-between shadow-sm"
              >
                <span>{activeSpaylaterOption.label}</span>
                <svg
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                    spaylaterDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Floating Dropdown Items */}
              {spaylaterDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-neutral-200/80 rounded-xl shadow-xl z-30 p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  {spaylaterOptions.map((opt) => {
                    const isActive = localProfile.spaylaterMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('spaylaterMode', opt.value);
                          setSpaylaterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                          isActive
                            ? "bg-orange-50 text-orange-600"
                            : "text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {localProfile.spaylaterMode === 'estimate' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Estimasi Proporsi SPayLater (%)</label>
                <input
                  type="number"
                  value={localProfile.spaylaterPct}
                  onChange={(e) => handleInputChange('spaylaterPct', Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 font-bold transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">Tenor SPayLater Terbanyak</label>
              <div className="grid grid-cols-2 gap-2">
                {[3, 6].map((tenor) => {
                  const isSelected = localProfile.spaylaterTenor === tenor;
                  return (
                    <button
                      key={tenor}
                      type="button"
                      onClick={() => handleInputChange('spaylaterTenor', tenor)}
                      className={`py-2 rounded-xl border font-black text-xs transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 text-orange-600 shadow-sm shadow-orange-100'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-500 bg-neutral-50/10'
                      }`}
                    >
                      {tenor} Bulan ({tenor === 3 ? '2.5%' : '4.0%'})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-150 flex gap-3 bg-neutral-50/30">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer shadow-orange-200"
          >
            Simpan &amp; Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
