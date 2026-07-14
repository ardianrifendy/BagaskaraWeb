"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkPin } from "../actions";

function StokLoginPageContent() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/stok";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isOk = await checkPin(pin);
      if (isOk) {
        // Force refresh agar middleware mendeteksi cookie baru
        router.push(redirect);
        router.refresh();
      } else {
        setError("PIN Toko salah! Silakan coba lagi.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-xl flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-black text-orange-600">Bagaskara Cell</span>
          <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-2">
            Akses Kontrol Stok
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              PIN Akses Toko
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-orange-500 dark:text-white"
              required
              autoFocus
            />
            {error && <span className="text-[10px] text-red-500 font-bold mt-1 text-center">{error}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
          Gunakan PIN default toko Anda untuk mengakses stok fisik.
        </span>
      </div>
    </div>
  );
}

export default function StokLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-xs font-bold text-neutral-400 dark:text-zinc-500 animate-pulse">Memuat...</div>
      </div>
    }>
      <StokLoginPageContent />
    </Suspense>
  );
}
