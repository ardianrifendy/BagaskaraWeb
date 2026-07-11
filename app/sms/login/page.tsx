"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function SmsLoginPageContent() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/sms";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/sms-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        // Force refresh dari server agar middleware membaca cookie baru
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Login gagal.");
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
          <Logo />
          <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-2">
            Akses Internal
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              Password Dashboard SMS
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-orange-500 dark:text-white"
              required
              autoFocus
            />
            {error && <span className="text-[10px] text-red-500 font-bold mt-1 text-center">{error}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl shadow-md transition-colors"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
          Masukkan password khusus untuk tool Aktivasi SMS.
        </span>
      </div>
    </div>
  );
}

export default function SmsLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-xs font-bold text-neutral-400 dark:text-zinc-500">Loading...</div>
      </div>
    }>
      <SmsLoginPageContent />
    </Suspense>
  );
}
