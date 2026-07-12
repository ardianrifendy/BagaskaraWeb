const STEPS = [
  {
    num: 1,
    title: "Salin link",
    desc: "Buka aplikasi YouTube, TikTok, Instagram, Facebook, Twitter, SoundCloud, atau Pinterest, lalu salin tautan video, audio, atau foto yang ingin Anda unduh.",
  },
  {
    num: 2,
    title: "Tempel di kolom",
    desc: "Kembali ke halaman ini, tempel link tadi ke kolom di atas menggunakan tombol Tempel atau ketik manual.",
  },
  {
    num: 3,
    title: "Pilih & Unduh",
    desc: "Klik Unduh Sekarang, lalu pilih kualitas atau format media yang Anda inginkan untuk mulai menyimpan.",
  },
];

const FAQ = [
  {
    q: "Apakah layanan ini gratis?",
    a: "Ya, sepenuhnya gratis. Anda dapat menggunakan Media Downloader Bagaskara Cell tanpa biaya dan tanpa perlu mendaftar.",
  },
  {
    q: "Apakah videonya tanpa watermark?",
    a: "Untuk TikTok, kami mengutamakan versi tanpa watermark bila tersedia sehingga hasil unduhan lebih bersih.",
  },
  {
    q: "Kenapa link privat gagal diunduh?",
    a: "Kami hanya dapat memproses konten yang bersifat publik. Video atau foto dari akun privat tidak dapat diakses demi menghormati privasi pemiliknya.",
  },
  {
    q: "Format apa saja yang didukung?",
    a: "Umumnya video MP4, audio MP3, dan foto JPG. Pilihan format yang tersedia menyesuaikan dengan sumber tautan yang Anda tempel.",
  },
  {
    q: "Apakah aman digunakan?",
    a: "Aman. Kami hanya mengambil tautan media langsung dari sumber, dan proses unduhan terjadi langsung dari perangkat Anda tanpa menyimpan file di server kami.",
  },
];

export default function HowToSection() {
  return (
    <section className="mt-12 space-y-8">
      {/* Cara pakai */}
      <div>
        <h2 className="text-center text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-5">
          Cara Menggunakan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex flex-col gap-2 shadow-sm"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-black text-sm">
                {step.num}
              </span>
              <h3 className="text-sm font-black text-neutral-800 dark:text-zinc-100">
                {step.title}
              </h3>
              <p className="text-xs font-medium text-neutral-400 dark:text-zinc-450 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer hak cipta */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/15 p-4 flex items-start gap-3">
        <svg className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="space-y-1">
          <span className="block text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Perhatian Hak Cipta
          </span>
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300/90 leading-relaxed">
            Gunakan tool ini hanya untuk mengunduh konten milik Anda sendiri atau konten yang Anda punya izin untuk menyimpannya. Hormati hak cipta kreator.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-center text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-5">
          Pertanyaan Umum
        </h2>
        <div className="space-y-2.5">
          {FAQ.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none select-none">
                <span className="text-xs md:text-sm font-black text-neutral-800 dark:text-zinc-100">
                  {item.q}
                </span>
                <svg className="w-4 h-4 flex-shrink-0 text-neutral-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-4 pb-4 text-xs font-medium text-neutral-500 dark:text-zinc-400 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
