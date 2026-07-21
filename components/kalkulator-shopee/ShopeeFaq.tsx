import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqList: FaqItem[] = [
  {
    question: 'Berapa biaya admin Shopee untuk Non-Star Seller?',
    answer: 'Biaya admin Non-Star Seller berkisar dari 2,5% (untuk unit otomotif/emas) hingga 10,0% untuk aksesoris, tergantung kategori produk. Biaya admin ini baru mulai dikenakan setelah toko Anda menyelesaikan lebih dari 50 pesanan sejak pertama kali beroperasi.'
  },
  {
    question: 'Apakah program Gratis Ongkir XTRA (GOX) itu wajib?',
    answer: 'Tidak, Gratis Ongkir XTRA adalah program opsional. Jika Anda bergabung, biaya layanan tambahan sebesar 1,0% hingga 8,0% (tergantung kategori, maksimal Rp 40.000 atau Rp 60.000 per kuantitas barang) akan dipotong dari setiap pesanan yang selesai.'
  },
  {
    question: 'Berapa persen biaya administrasi untuk Shopee Mall?',
    answer: 'Tarif administrasi Shopee Mall berkisar antara 2,5% sampai 11,7%. Selain itu, seller Shopee Mall dikenakan biaya pembayaran (payment fee) tetap sebesar 1,8% dari total pesanan.'
  },
  {
    question: 'Apa perbedaan program Promo XTRA dengan Promo XTRA+?',
    answer: 'Promo XTRA membebankan biaya layanan tambahan 4,5% (maksimal Rp 60.000). Sedangkan Promo XTRA+ membebankan tarif 6,5% (maksimal Rp 80.000) dengan keunggulan voucher diskon belanja yang jauh lebih besar bagi pembeli Anda.'
  },
  {
    question: 'Apakah biaya admin Shopee sudah termasuk pajak PPN?',
    answer: 'Ya, seluruh rincian tarif persentase biaya admin Shopee yang digunakan di kalkulator ini sudah termasuk PPN 12% sesuai undang-undang perpajakan yang berlaku di Indonesia.'
  }
];

export const ShopeeFaq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-colors">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <div className="flex flex-col gap-1 text-left">
        <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Tanya Jawab</span>
        <h2 className="text-xl md:text-2xl font-black text-neutral-850 dark:text-zinc-100 tracking-tight">
          Pertanyaan Sering Diajukan (FAQ Shopee)
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {faqList.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all bg-neutral-50/30 dark:bg-zinc-850/30"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 text-left font-black text-xs md:text-sm text-neutral-850 dark:text-zinc-100 flex justify-between items-center cursor-pointer gap-4"
              >
                <span>{faq.question}</span>
                <span className="text-orange-600 font-bold flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs font-medium text-neutral-600 dark:text-zinc-400 leading-relaxed border-t border-neutral-100 dark:border-zinc-800/80 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
