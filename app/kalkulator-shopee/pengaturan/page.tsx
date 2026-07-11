"use client";

import React, { useState, useEffect } from 'react';
import { useStoreProfile } from '@/lib/kalkulator/store/localStorage';
import { StoreProfile, SellerType, PromoProgram } from '@/lib/kalkulator/engine/types';
import Link from 'next/link';

export default function PengaturanPage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useStoreProfile();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSave = () => {
    alert('Profil toko berhasil disimpan!');
  };

  const handleInputChange = (field: keyof StoreProfile, val: unknown) => {
    setProfile({
      ...profile,
      [field]: val
    });
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20 text-neutral-850 font-sans">
        <header className="bg-white border-b border-neutral-100 sticky top-0 z-40 px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <Link href="/kalkulator-shopee" className="text-neutral-500 hover:text-orange-600 text-lg font-bold">
            ←
          </Link>
          <div>
            <h1 className="text-xs font-black tracking-tight uppercase text-neutral-900">Profil Toko</h1>
            <span className="text-[9px] text-neutral-400 font-extrabold block uppercase tracking-wider mt-0.5 select-none">
              Loading...
            </span>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-20 text-neutral-850 font-sans">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img src="/images/logo-light.png" alt="Bagaskara Cell" className="h-9 w-auto object-contain select-none" />
            </Link>
            <span className="text-[8px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded-md font-black select-none uppercase tracking-widest shadow-sm shadow-orange-100">
              Profil Toko
            </span>
          </div>
          <Link
            href="/kalkulator-shopee"
            className="text-xs font-black px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-orange-600 transition-all flex items-center gap-1.5 shadow-sm shadow-neutral-100 cursor-pointer"
          >
            ← Kembali
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
        {/* Tipe Penjual */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-3">
          <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider select-none">TIPE TOKO</label>
          <div className="grid grid-cols-2 gap-2">
            {(['regular', 'mall'] as SellerType[]).map((type) => {
              const isActive = profile.sellerType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('sellerType', type)}
                  className={`py-3 rounded-xl border font-black text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    isActive
                      ? 'border-orange-500 bg-orange-50/70 text-orange-600 shadow-sm shadow-orange-100'
                      : 'border-neutral-200 hover:border-neutral-350 text-neutral-500 bg-neutral-50/20'
                  }`}
                >
                  {type === 'regular' ? 'Reguler (Non-Star/Star/+)' : 'Shopee Mall'}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-neutral-400 font-extrabold leading-relaxed select-none">
            * Toko Non-Star, Star, dan Star+ memiliki tarif yang sama per kategori Shopee.
          </span>
        </div>

        {/* Toko Baru */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-extrabold text-neutral-800 block">Toko Baru (&lt;50 pesanan)</span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-extrabold">Bebas biaya admin &amp; proses pesanan</span>
          </div>
          <button
            type="button"
            onClick={() => handleInputChange('isNewStore', !profile.isNewStore)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              profile.isNewStore ? 'bg-orange-600' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                profile.isNewStore ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Iklan & Pengeluaran Toko */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4">
          <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider select-none">BIAYA DEFAULT OPERASIONAL</label>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Biaya Proses Pesanan Shopee (Rp)</label>
            <input
              type="number"
              value={profile.orderProcessingFee}
              onChange={(e) => handleInputChange('orderProcessingFee', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200"
            />
            <span className="text-[10px] text-neutral-400 font-extrabold select-none">Biaya tetap per transaksi, default Rp 1.250.</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Packing (Rp)</label>
              <input
                type="number"
                value={profile.packingCost}
                onChange={(e) => handleInputChange('packingCost', parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Iklan (%)</label>
              <input
                type="number"
                step="0.1"
                value={profile.adCostPct}
                onChange={(e) => handleInputChange('adCostPct', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider" title="Komisi Affiliate Marketing Solution (AMS)">Affiliate (%)</label>
              <input
                type="number"
                step="0.1"
                value={profile.affiliateCommissionPct || 0}
                onChange={(e) => handleInputChange('affiliateCommissionPct', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* SPayLater Settings */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-3">
          <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider select-none">BIAYA SPAYLATER (PENJUAL)</label>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Mode Perhitungan</label>
            <select
              value={profile.spaylaterMode}
              onChange={(e) => handleInputChange('spaylaterMode', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200 cursor-pointer"
            >
              <option value="off">Abaikan SPayLater (0%)</option>
              <option value="worst">Hitung Penuh (Worst Case)</option>
              <option value="estimate">Estimasi proporsi pembeli</option>
            </select>
          </div>

          {profile.spaylaterMode === 'estimate' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Proporsi Pengguna SPayLater (%)</label>
              <input
                type="number"
                value={profile.spaylaterPct}
                onChange={(e) => handleInputChange('spaylaterPct', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-extrabold transition-all duration-200"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Tenor SPayLater Terbanyak</label>
            <div className="grid grid-cols-2 gap-2">
              {[3, 6].map((tenor) => {
                const isSelected = profile.spaylaterTenor === tenor;
                return (
                  <button
                    key={tenor}
                    type="button"
                    onClick={() => handleInputChange('spaylaterTenor', tenor)}
                    className={`py-2.5 rounded-xl border font-black text-xs transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/70 text-orange-600 shadow-sm shadow-orange-100'
                        : 'border-neutral-200 hover:border-neutral-350 text-neutral-500 bg-neutral-50/20'
                    }`}
                  >
                    {tenor} Bulan ({tenor === 3 ? '2.5%' : '4.0%'})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-orange-700 transition-all uppercase tracking-wider cursor-pointer shadow-orange-200/50"
        >
          Simpan &amp; Terapkan
        </button>
      </div>
    </main>
  );
}
