import React from 'react';
import { StoreProfile, PromoProgram } from '@/lib/kalkulator/engine/types';

interface ProgramTogglesProps {
  profile: StoreProfile;
  onChange: (updated: StoreProfile) => void;
}

export const ProgramToggles: React.FC<ProgramTogglesProps> = ({ profile, onChange }) => {
  const handleGoxChange = () => {
    onChange({ ...profile, joinedGOX: !profile.joinedGOX });
  };

  const handleInsuranceChange = () => {
    onChange({ ...profile, joinedInsurance: !profile.joinedInsurance });
  };

  const handlePromoProgramChange = (program: PromoProgram) => {
    onChange({ ...profile, promoProgram: program });
  };

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
      <h4 className="text-[10px] font-extrabold text-neutral-400 tracking-wider uppercase select-none">PROGRAM PENJUAL AKTIF</h4>

      {/* Gratis Ongkir XTRA (GOX) */}
      <div className="flex items-center justify-between py-1 border-b border-neutral-100 pb-3">
        <div>
          <span className="text-sm font-extrabold text-neutral-800 block">Gratis Ongkir XTRA (GOX)</span>
          <span className="text-[10px] text-neutral-400 mt-0.5 block font-extrabold">Potongan per-kategori (biasa/khusus)</span>
        </div>
        <button
          type="button"
          onClick={handleGoxChange}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            profile.joinedGOX ? 'bg-orange-600' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              profile.joinedGOX ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Program Asuransi Penjual (0.5%) */}
      <div className="flex items-center justify-between py-1 border-b border-neutral-100 pb-3">
        <div>
          <span className="text-sm font-extrabold text-neutral-800 block">Program Asuransi Penjual</span>
          <span className="text-[10px] text-neutral-400 mt-0.5 block font-extrabold">Potongan 0.5% dari harga jual produk</span>
        </div>
        <button
          type="button"
          onClick={handleInsuranceChange}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            profile.joinedInsurance ? 'bg-orange-600' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              profile.joinedInsurance ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Radio Program Promo XTRA / XTRA+ */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider select-none">Program Promo Shopee</span>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'xtra', 'xtra_plus'] as PromoProgram[]).map((prog) => {
            const isActive = profile.promoProgram === prog;
            let label = 'Tanpa Program';
            let details = 'Admin normal';
            if (prog === 'xtra') {
              label = 'Promo XTRA';
              details = '+4.5% (cap 60k)';
            } else if (prog === 'xtra_plus') {
              label = 'Promo XTRA+';
              details = '+6.5% (cap 80k)';
            }

            return (
              <button
                key={prog}
                type="button"
                onClick={() => handlePromoProgramChange(prog)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isActive
                    ? 'border-orange-500 bg-orange-50/70 text-orange-600 font-extrabold shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-350 text-neutral-500 hover:text-neutral-700 bg-neutral-50/20'
                }`}
              >
                <span className="text-xs font-black block leading-none">{label}</span>
                <span className="text-[9px] text-neutral-400 font-extrabold block leading-none mt-0.5">{details}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
