import React from 'react';

export const ShopeeTarifTable: React.FC = () => {
  const data = [
    {
      kategori: "Handphone, Tablet, Laptop & Desktop",
      nonStar: "5,25%",
      mall: "4,20% - 4,70%",
      contoh: "iPhone, Samsung Galaxy, ASUS ROG, SSD, RAM, Printer"
    },
    {
      kategori: "Aksesoris HP, Casing, Kelistrikan & Charger",
      nonStar: "10,00%",
      mall: "10,20%",
      contoh: "Powerbank, Kabel Charger, Memory Card, Stop Kontak"
    },
    {
      kategori: "Pakaian Pria, Wanita & Fashion Muslim",
      nonStar: "8,25%",
      mall: "9,95%",
      contoh: "Kaos, Kemeja, Dress, Mukena, Gamis, Jaket"
    },
    {
      kategori: "Sepatu, Sandal, Tas & Jam Tangan",
      nonStar: "9,00%",
      mall: "10,20%",
      contoh: "Sneakers, Tas Ransel, Dompet, Jam Tangan Analog/Digital"
    },
    {
      kategori: "Perawatan, Skincare & Kosmetik Kecantikan",
      nonStar: "8,25%",
      mall: "9,95%",
      contoh: "Serum Wajah, Lipstick, Sunscreen, Parfum, Pomade"
    },
    {
      kategori: "Kebutuhan Ibu & Bayi (Umum)",
      nonStar: "8,25%",
      mall: "7,20% - 7,70%",
      contoh: "Susu Formula, Popok Bayi, Sabun Bayi, Botol Susu"
    },
    {
      kategori: "Makanan & Minuman Instan / Bahan Pokok",
      nonStar: "6,75% - 9,50%",
      mall: "6,20% - 10,20%",
      contoh: "Beras, Mie Instan, Cemilan, Kopi, Sirup, Kue Kering"
    },
    {
      kategori: "Perlengkapan Rumah, Olahraga & Outdoor",
      nonStar: "10,00%",
      mall: "11,70%",
      contoh: "Sprei, Wajan, Matras Yoga, Tenda Camping, Alat Pertukangan"
    },
    {
      kategori: "Logam Mulia & Perhiasan Berharga",
      nonStar: "4,25%",
      mall: "3,20%",
      contoh: "Emas Antam, Cincin Kawin, Perhiasan Perak/Emas"
    }
  ];

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-colors">
      <div className="flex flex-col gap-1 text-left">
        <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Tabel Tarif Resmi</span>
        <h2 className="text-xl md:text-2xl font-black text-neutral-850 dark:text-zinc-100 tracking-tight">
          Ringkasan Tarif Komisi Penjual Shopee (Update Terbaru)
        </h2>
        <p className="text-xs text-neutral-500 dark:text-zinc-400 font-medium">
          Daftar perkiraan persentase biaya administrasi final (termasuk PPN 12%) berdasarkan jenis seller dan kategori produk utama.
        </p>
      </div>

      <div className="overflow-x-auto border border-neutral-200 dark:border-zinc-800 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/70 dark:bg-zinc-800/70 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 font-black uppercase text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Kategori Produk</th>
              <th className="py-3.5 px-4 text-center">Non-Star / Star / Star+</th>
              <th className="py-3.5 px-4 text-center">Shopee Mall</th>
              <th className="py-3.5 px-4">Contoh Produk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 font-semibold text-neutral-800 dark:text-zinc-200">
            {data.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-neutral-50/40 dark:bg-zinc-850/40'}>
                <td className="py-3.5 px-4 font-bold">{row.kategori}</td>
                <td className="py-3.5 px-4 text-center text-neutral-600 dark:text-zinc-400 font-bold">{row.nonStar}</td>
                <td className="py-3.5 px-4 text-center font-black text-orange-600 dark:text-orange-400">{row.mall}</td>
                <td className="py-3.5 px-4 text-neutral-500 font-medium text-[11px]">{row.contoh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
