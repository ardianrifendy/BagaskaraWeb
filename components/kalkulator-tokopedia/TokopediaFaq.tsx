import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqList: FaqItem[] = [
  {
    question: 'Berapa biaya admin TikTok Shop 2026?',
    answer: 'Biaya admin TikTok Shop & Tokopedia terdiri dari Komisi Platform (2,5% - 12.2% tergantung kategori) dan Komisi Dinamis per kategori induk (3,0% - 8,0%). Batas maksimal (cap) komisi adalah Rp 650.000 per item.'
  },
  {
    question: 'Apa itu biaya komisi dinamis?',
    answer: 'Komisi Dinamis adalah biaya persentase layanan yang dikenakan Tokopedia & TikTok Shop per kategori produk, dihitung dari (Harga produk - Diskon seller) dengan cap maksimal Rp 650.000 per unit.'
  },
  {
    question: 'Apakah biaya admin Tokopedia dan TikTok Shop sama?',
    answer: 'Ya, sejak Mei 2026, Tokopedia dan TikTok Shop menggunakan satu skema tarif dan model komisi yang terintegrasi penuh di bawah grup GoTo & ByteDance.'
  },
  {
    question: 'Apakah komisi dikembalikan kalau produk diretur?',
    answer: 'Komisi dinamis dan platform tidak dikembalikan oleh marketplace jika order diretur/dibatalkan setelah barang terkirim ke pembeli.'
  },
  {
    question: 'Bagaimana cara mengurangi komisi platform?',
    answer: 'Penjual dapat memanfaatkan program diskon komisi seperti GMV Max atau Growth Xtra yang memberikan potongan hingga 20% pada komisi platform.'
  }
];

export const TokopediaFaq: React.FC = () => {
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
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tanya Jawab</span>
        <h2 className="text-xl md:text-2xl font-black text-neutral-850 dark:text-zinc-100 tracking-tight">
          Pertanyaan Sering Diajukan (FAQ)
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
                <span className="text-emerald-600 font-bold flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
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
