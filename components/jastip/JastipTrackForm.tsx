"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeOrderCode } from "@/lib/jastip/order-code";

export default function JastipTrackForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Kode order tidak boleh kosong.");
      return;
    }

    // Normalize: e.g. jst-7kq2-m9xd -> JST-7KQ2-M9XD
    const normalized = normalizeOrderCode(trimmed);

    // Simple validation of pattern JST-XXXX-XXXX
    const pattern = /^JST-[2-9A-Z]{4}-[2-9A-Z]{4}$/;
    if (!pattern.test(normalized)) {
      setError("Format kode tidak valid. Contoh: JST-7KQ2-M9XD");
      return;
    }

    router.push(`/jastip/track/${normalized}`);
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] uppercase font-black text-neutral-400 dark:text-zinc-500 tracking-wider">
              Masukkan Kode Order Jastip Anda
            </label>
            <input
              type="text"
              placeholder="Contoh: JST-7KQ2-M9XD"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              maxLength={20}
              required
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm md:text-base font-bold text-center tracking-wider text-neutral-800 dark:text-zinc-150 dark:placeholder-zinc-650 transition-all shadow-inner"
            />
            {error && (
              <span className="text-[10px] text-red-500 font-bold mt-1 text-center animate-pulse">
                {error}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs md:text-sm rounded-xl transition duration-200 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-900/10 dark:shadow-orange-650/10"
          >
            Lacak Order Jastip
          </button>
        </form>
      </div>

      <p className="mt-4 px-1 text-center text-xs md:text-sm font-medium text-neutral-400 dark:text-zinc-500">
        Masukkan 8 karakter kode pelacakan yang diberikan oleh admin untuk memantau status belanjaan Anda secara real-time.
      </p>
    </div>
  );
}
