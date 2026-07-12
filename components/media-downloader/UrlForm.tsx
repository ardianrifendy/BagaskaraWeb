"use client";

import { useState } from "react";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function UrlForm({ onSubmit, loading }: UrlFormProps) {
  const [url, setUrl] = useState("");

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Akses clipboard ditolak / tidak tersedia — abaikan tanpa error.
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  }

  return (
    <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
            Link Video / Foto
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="url"
              placeholder="Tempel link video di sini, contoh: https://vt.tiktok.com/..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={loading}
              className="w-full pl-3.5 pr-24 py-3.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150 dark:placeholder-zinc-650 transition-all shadow-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={loading}
              className="absolute right-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 text-[10px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Tempel dari clipboard"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tempel
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-neutral-900 dark:bg-orange-600 hover:bg-neutral-800 dark:hover:bg-orange-700 text-white font-black text-xs md:text-sm rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-neutral-900/10 dark:shadow-orange-650/10"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses link Anda...
            </>
          ) : (
            "Unduh Sekarang"
          )}
        </button>
      </form>
    </div>
  );
}
