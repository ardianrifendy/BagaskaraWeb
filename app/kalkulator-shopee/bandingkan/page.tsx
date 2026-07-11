"use client";

import React from 'react';
import { useStoreProfile, useActiveProduct } from '@/lib/kalkulator/store/localStorage';
import { calculateFees } from '@/lib/kalkulator/engine/calc';
import { formatIDR } from '@/lib/kalkulator/format';
import { StoreProfile, ProductInput, CalcResult } from '@/lib/kalkulator/engine/types';
import Link from 'next/link';

export default function BandingkanPage() {
  const [profile] = useStoreProfile();
  const [product] = useActiveProduct();

  // Harga dasar pembanding
  const testPrice = 100000; // default test price Rp 100.000 untuk perbandingan % bersih

  // Buat 4 skenario profil toko
  const scenarios: { label: string; profile: StoreProfile }[] = [
    {
      label: 'Tanpa Program (Normal)',
      profile: { ...profile, joinedGOX: false, promoProgram: 'none' }
    },
    {
      label: 'Hanya GOX',
      profile: { ...profile, joinedGOX: true, promoProgram: 'none' }
    },
    {
      label: 'GOX + Promo XTRA',
      profile: { ...profile, joinedGOX: true, promoProgram: 'xtra' }
    },
    {
      label: 'GOX + Promo XTRA+',
      profile: { ...profile, joinedGOX: true, promoProgram: 'xtra_plus' }
    }
  ];

  // Hitung hasil untuk tiap skenario
  const results = scenarios.map((scen) => {
    const calc = calculateFees(
      {
        ...product,
        cost: 0, // modal diabaikan untuk tahu potongan total
        sellerDiscount: 0,
        qty: 1
      },
      scen.profile,
      testPrice
    );
    return {
      label: scen.label,
      calc
    };
  });

  // Cari skenario dengan Net Diterima tertinggi (potongan terkecil)
  const highestNetIdx = results.reduce((maxIdx, res, idx, arr) => 
    res.calc.netReceived > arr[maxIdx].calc.netReceived ? idx : maxIdx, 0
  );

  return (
    <main className="min-h-screen bg-neutral-50 pb-20 text-neutral-850 font-sans">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="https://bagaskaracell.net" className="flex items-center">
              <img src="/images/logo-light.png" alt="Bagaskara Cell" className="h-9 w-auto object-contain select-none" />
            </Link>
            <span className="text-[8px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded-md font-black select-none uppercase tracking-widest shadow-sm shadow-orange-100">
              Bandingkan Skenario
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

      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4">
          <p className="text-xs text-neutral-500 leading-relaxed font-extrabold select-none mb-1">
            Perbandingan detail potongan biaya Shopee berdasarkan program yang Anda ikuti pada harga produk Rp 100.000:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res, idx) => {
              // Deteksi jika skenario ini adalah profil aktif
              const isCurrentProfile =
                profile.joinedGOX === scenarios[idx].profile.joinedGOX &&
                profile.promoProgram === scenarios[idx].profile.promoProgram;

              const isBestNet = idx === highestNetIdx;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all duration-200 ${
                    isCurrentProfile
                      ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm'
                      : 'border-neutral-200 bg-neutral-50/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-black text-neutral-800 uppercase tracking-tight flex flex-wrap items-center gap-1">
                      {res.label} 
                      {isCurrentProfile && (
                        <span className="text-[8px] bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-black shadow-sm shadow-orange-200">
                          AKTIF
                        </span>
                      )}
                      {isBestNet && (
                        <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-black shadow-sm shadow-emerald-200">
                          POTONGAN TERENDAH
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-black text-rose-600">
                      -{res.calc.totalFeesPct}% Potongan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-extrabold text-neutral-500">
                    <div>
                      Net Diterima: <span className="text-neutral-800 font-extrabold bg-neutral-100/50 px-1 py-0.5 rounded">{formatIDR(res.calc.netReceived)}</span>
                    </div>
                    <div>
                      Total Biaya: <span className="text-rose-600 font-extrabold">{formatIDR(res.calc.totalFees)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
