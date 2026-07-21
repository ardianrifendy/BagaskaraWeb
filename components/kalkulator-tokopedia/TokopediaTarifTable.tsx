import React from 'react';
import tarifBaruData from '../../data/tarif/tokopedia-2026-05-18.json';

export const TokopediaTarifTable: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-colors">
      <div className="flex flex-col gap-1 text-left">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tabel Tarif Resmi</span>
        <h2 className="text-xl md:text-2xl font-black text-neutral-850 dark:text-zinc-100 tracking-tight">
          Tabel Tarif Komisi Dinamis Tokopedia &amp; TikTok Shop (30 Kategori)
        </h2>
        <p className="text-xs text-neutral-500 dark:text-zinc-400 font-medium">
          Daftar perubahan tarif komisi dinamis dari skema lama (10 Jun 2025) ke skema terbaru (18 Mei 2026). Cap maksimal Rp 650.000 / item.
        </p>
      </div>

      <div className="overflow-x-auto border border-neutral-200 dark:border-zinc-800 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/70 dark:bg-zinc-800/70 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 font-black uppercase text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Kategori Induk</th>
              <th className="py-3.5 px-4 text-center">Tarif Lama (10 Jun 2025)</th>
              <th className="py-3.5 px-4 text-center">Tarif Baru (18 Mei 2026)</th>
              <th className="py-3.5 px-4 text-center">Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 font-semibold text-neutral-800 dark:text-zinc-200">
            {tarifBaruData.kategori.map((cat, idx) => {
              const rateLama = cat.rateDinamisLama ?? cat.rateDinamis;
              const rateBaru = cat.rateDinamis;
              const diff = rateBaru - rateLama;

              let badge = <span className="text-neutral-400 font-bold">➖ Tetap</span>;
              if (diff < 0) {
                badge = <span className="text-emerald-600 dark:text-emerald-400 font-black">📉 Turun ({diff.toFixed(2)}%)</span>;
              } else if (diff > 0) {
                badge = <span className="text-rose-600 dark:text-rose-400 font-black">🔺 Naik (+{diff.toFixed(2)}%)</span>;
              }

              return (
                <tr key={cat.slug} className={idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-neutral-50/40 dark:bg-zinc-850/40'}>
                  <td className="py-3 px-4 font-bold">{cat.nama}</td>
                  <td className="py-3 px-4 text-center text-neutral-500 font-bold">{rateLama.toFixed(2).replace('.', ',')}%</td>
                  <td className="py-3 px-4 text-center font-black text-emerald-600 dark:text-emerald-400">{rateBaru.toFixed(2).replace('.', ',')}%</td>
                  <td className="py-3 px-4 text-center">{badge}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
