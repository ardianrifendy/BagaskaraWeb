"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CourierSelect from "./CourierSelect";
import CekResiResult from "./CekResiResult";
import { isSupportedCourier } from "@/lib/couriers";
import type { CekResiApiResponse, CourierCode, TrackingResult } from "@/types/tracking";
import { siteConfig } from "@/config/site";

type Status = "idle" | "loading" | "success" | "error";

export default function CekResiForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courier, setCourier] = useState<CourierCode | "">(() => {
    const initial = searchParams.get("courier")?.toLowerCase() ?? "";
    return isSupportedCourier(initial) ? initial : "";
  });
  const [awb, setAwb] = useState<string>(() => searchParams.get("awb")?.trim() ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const runTrack = useCallback(async (courierValue: CourierCode, awbValue: string) => {
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/cek-resi?courier=${encodeURIComponent(courierValue)}&awb=${encodeURIComponent(awbValue)}`
      );
      const body: CekResiApiResponse = await response.json();

      if (body.ok) {
        setResult(body.result);
        setStatus("success");
      } else {
        setErrorMessage(body.error);
        setWaMessage(body.waFallbackMessage);
        setStatus("error");
      }
    } catch {
      setErrorMessage("Gagal menghubungi server, coba lagi.");
      setWaMessage(`Halo, saya mau tanya status resi ${awbValue} kurir ${courierValue}`);
      setStatus("error");
    }
  }, []);

  // Auto-submit once when page is opened with shareable link (?courier=&awb=)
  useEffect(() => {
    if (courier && awb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runTrack(courier, awb);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedAwb = awb.trim();
    if (!courier || !trimmedAwb) return;

    router.replace(`/cek-resi?courier=${courier}&awb=${encodeURIComponent(trimmedAwb)}`, {
      scroll: false,
    });
    runTrack(courier, trimmedAwb);
  }

  const waHref = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(waMessage)}`
    : undefined;

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <CourierSelect value={courier} onChange={setCourier} disabled={status === "loading"} />
          
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
              Nomor Resi / AWB
            </label>
            <input
              type="text"
              placeholder="Masukkan nomor resi (contoh: JP6961181926)"
              value={awb}
              onChange={(event) => setAwb(event.target.value)}
              disabled={status === "loading"}
              maxLength={30}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150 dark:placeholder-zinc-650 transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !courier || !awb.trim()}
            className="w-full py-3 bg-neutral-900 dark:bg-orange-600 hover:bg-neutral-800 dark:hover:bg-orange-700 text-white font-black text-xs md:text-sm rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Melacak Paket...
              </>
            ) : (
              "Lacak Paket"
            )}
          </button>
        </form>
      </div>

      {status === "idle" && (
        <p className="mt-4 px-1 text-center text-xs md:text-sm font-medium text-neutral-400 dark:text-zinc-500">
          Nomor resi pengiriman dapat Anda lihat di struk atau pesan konfirmasi pembelian dari Bagaskara Cell.
        </p>
      )}

      {status === "loading" && (
        <div className="mt-8 rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm space-y-4 animate-pulse">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-zinc-800/80">
            <div className="space-y-1.5 w-1/3">
              <div className="h-2.5 bg-neutral-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-4 bg-neutral-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-6 w-20 bg-neutral-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-10 bg-neutral-200 dark:bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="h-8 bg-neutral-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-8 bg-neutral-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 rounded-3xl border border-red-100 dark:border-red-950/30 bg-red-50/40 dark:bg-red-950/10 p-5 text-center flex flex-col items-center gap-3.5 animate-in fade-in">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs md:text-sm font-bold text-red-800 dark:text-red-400">{errorMessage}</p>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-extrabold text-xs md:text-sm px-5 py-2.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
              </svg>
              Tanya Admin via WhatsApp
            </a>
          )}
        </div>
      )}

      {status === "success" && result && <CekResiResult result={result} />}
    </div>
  );
}
