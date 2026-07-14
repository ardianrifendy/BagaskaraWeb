"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CourierSelect from "./CourierSelect";
import CekResiResult from "./CekResiResult";
import { isSupportedCourier, getCourierLabel } from "@/lib/couriers";
import type { CekResiApiResponse, CourierCode, TrackingResult } from "@/types/tracking";
import { siteConfig } from "@/config/site";
import TutorialModal from "@/components/TutorialModal";

interface TrackingRow {
  id: string;
  courier: CourierCode | "";
  awb: string;
}

interface MultiResultItem {
  courier: CourierCode;
  awb: string;
  loading: boolean;
  error: string | null;
  data: TrackingResult | null;
}

type Status = "idle" | "loading" | "success" | "error";

export default function CekResiForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi rows input state
  const [rows, setRows] = useState<TrackingRow[]>([
    { id: "row-1", courier: "", awb: "" }
  ]);
  const [status, setStatus] = useState<Status>("idle");
  const [multiResults, setMultiResults] = useState<MultiResultItem[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Parallel tracking logic
  const runTrackMulti = useCallback(async (queries: { courier: CourierCode; awb: string }[]) => {
    setStatus("loading");
    setActiveTab(0);

    // Initialize list of trackings with loading state
    const initialResults: MultiResultItem[] = queries.map(q => ({
      courier: q.courier,
      awb: q.awb,
      loading: true,
      error: null,
      data: null,
    }));
    setMultiResults(initialResults);

    try {
      const promises = queries.map(async (q, idx) => {
        try {
          const response = await fetch(
            `/api/cek-resi?courier=${encodeURIComponent(q.courier)}&awb=${encodeURIComponent(q.awb)}`
          );
          const body: CekResiApiResponse = await response.json();

          setMultiResults(prev => prev.map((item, i) => {
            if (i === idx) {
              return {
                ...item,
                loading: false,
                data: body.ok ? body.result : null,
                error: body.ok ? null : body.error,
              };
            }
            return item;
          }));
        } catch {
          setMultiResults(prev => prev.map((item, i) => {
            if (i === idx) {
              return {
                ...item,
                loading: false,
                data: null,
                error: "Gagal menghubungkan ke server.",
              };
            }
            return item;
          }));
        }
      });

      await Promise.all(promises);
      setStatus("success");
    } catch (err) {
      console.error("[runTrackMulti] parallel track failed", err);
      setStatus("error");
    }
  }, []);

  // Parse URL query parameters on mount to auto-trigger tracking (shareable links support)
  useEffect(() => {
    const couriersParam = searchParams.get("couriers") || "";
    const awbsParam = searchParams.get("awbs") || "";
    const courierParam = searchParams.get("courier") || "";
    const awbParam = searchParams.get("awb") || "";

    const initialRows: TrackingRow[] = [];

    if (couriersParam && awbsParam) {
      const couriers = couriersParam.split(",");
      const awbs = awbsParam.split(",");
      const count = Math.min(couriers.length, awbs.length);
      for (let i = 0; i < count; i++) {
        const c = couriers[i].trim().toLowerCase();
        const a = awbs[i].trim();
        if (isSupportedCourier(c) && a) {
          initialRows.push({
            id: `row-${i}-${Date.now()}`,
            courier: c as CourierCode,
            awb: a,
          });
        }
      }
    } else if (courierParam && awbParam) {
      const c = courierParam.trim().toLowerCase();
      const a = awbParam.trim();
      if (isSupportedCourier(c) && a) {
        initialRows.push({
          id: `row-single-${Date.now()}`,
          courier: c as CourierCode,
          awb: a,
        });
      }
    }

    if (initialRows.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(initialRows);
      setIsTrackingModalOpen(true);
      runTrackMulti(initialRows.map(r => ({ courier: r.courier as CourierCode, awb: r.awb })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseModal = () => {
    setIsTrackingModalOpen(false);
    setStatus("idle");
    setMultiResults([]);
    router.replace("/cek-resi", { scroll: false });
  };

  // Lock body scroll when tracking modal is open
  useEffect(() => {
    if (isTrackingModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isTrackingModalOpen]);

  const addRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setRows(prev => [...prev, { id: newId, courier: "", awb: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: "courier" | "awb", value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        if (field === "courier") {
          return { ...row, courier: value as CourierCode | "" };
        }
        return { ...row, awb: value };
      }
      return row;
    }));
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const filledRows = rows.filter(r => r.courier && r.awb.trim()) as { id: string; courier: CourierCode; awb: string }[];
    if (filledRows.length === 0) return;

    const couriersStr = filledRows.map(r => r.courier).join(",");
    const awbsStr = filledRows.map(r => r.awb.trim()).join(",");

    router.replace(`/cek-resi?couriers=${couriersStr}&awbs=${encodeURIComponent(awbsStr)}`, {
      scroll: false,
    });

    setIsTrackingModalOpen(true);
    runTrackMulti(filledRows.map(r => ({ courier: r.courier, awb: r.awb.trim() })));
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="p-4 rounded-2xl border border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-950/10 space-y-3.5 relative animate-in fade-in duration-200"
              >
                {/* Remove button */}
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                    title="Hapus Resi Ini"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Badge Number */}
                <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-zinc-500">
                  Resi #{idx + 1}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CourierSelect
                    value={row.courier}
                    onChange={(val) => updateRow(row.id, "courier", val)}
                    disabled={status === "loading" && isTrackingModalOpen}
                  />
                  
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
                      Nomor Resi / AWB
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nomor resi..."
                      value={row.awb}
                      onChange={(event) => updateRow(row.id, "awb", event.target.value)}
                      disabled={status === "loading" && isTrackingModalOpen}
                      maxLength={30}
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150 dark:placeholder-zinc-650 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={addRow}
            disabled={status === "loading" && isTrackingModalOpen}
            className="w-full py-2.5 border border-dashed border-neutral-200 dark:border-zinc-800 hover:border-neutral-400 dark:hover:border-zinc-600 text-neutral-500 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 text-xs md:text-sm font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Resi Lain
          </button>

          {/* Track Submit Button */}
          <button
            type="submit"
            disabled={status === "loading" && isTrackingModalOpen}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs md:text-sm rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-900/10 dark:shadow-orange-650/10"
          >
            {status === "loading" && isTrackingModalOpen ? (
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
          Masukkan kurir dan resi untuk melacak paket Anda. Anda dapat menambahkan lebih dari satu resi sekaligus.
        </p>
      )}

      {/* Dynamic Results Popup Modal */}
      {isTrackingModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onClick={handleCloseModal}
        >
          <div 
            className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xs md:text-sm font-black text-neutral-850 dark:text-zinc-150 uppercase tracking-widest">
                Detail Pengiriman {multiResults.length > 1 && `(${multiResults.length} Paket)`}
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:text-neutral-850 dark:hover:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer shadow-sm animate-none"
                title="Tutup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Tabs for Multi-results */}
            {multiResults.length > 1 && (
              <div className="flex border-b border-neutral-100 dark:border-zinc-800 overflow-x-auto scrollbar-none px-4 py-2 gap-2 bg-neutral-50/50 dark:bg-zinc-950/20">
                {multiResults.map((item, idx) => {
                  const isActive = idx === activeTab;
                  const label = getCourierLabel(item.courier) || item.courier.toUpperCase();
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-left min-w-[130px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-white dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 shadow-sm"
                          : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-wider block ${isActive ? "text-orange-600 dark:text-orange-455" : ""}`}>
                        {label}
                      </span>
                      <span className="text-xs font-black truncate max-w-[110px] block mt-0.5 text-neutral-800 dark:text-zinc-200">
                        {item.awb}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider block mt-0.5 ${
                        item.loading
                          ? "text-neutral-400 dark:text-zinc-550 animate-pulse"
                          : item.error
                            ? "text-red-500"
                            : "text-emerald-600 dark:text-emerald-450"
                      }`}>
                        {item.loading ? "Loading..." : item.error ? "Gagal" : item.data?.summary.status || "Selesai"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab content area */}
            <div className="overflow-y-auto flex-1 p-5 md:p-6 bg-white dark:bg-zinc-900">
              {multiResults[activeTab] ? (
                multiResults[activeTab].loading ? (
                  <ResultSkeleton />
                ) : multiResults[activeTab].error ? (
                  <div className="rounded-3xl border border-red-100 dark:border-red-950/30 bg-red-50/40 dark:bg-red-950/10 p-5 text-center flex flex-col items-center gap-3.5 animate-in fade-in">
                    <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs md:text-sm font-bold text-red-800 dark:text-red-400">
                      {multiResults[activeTab].error}
                    </p>
                    <a
                      href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(`Halo, saya mau tanya status resi ${multiResults[activeTab].awb} kurir ${multiResults[activeTab].courier}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-extrabold text-xs md:text-sm px-5 py-2.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
                      </svg>
                      Tanya Admin via WhatsApp
                    </a>
                  </div>
                ) : multiResults[activeTab].data ? (
                  <CekResiResult result={multiResults[activeTab].data} />
                ) : null
              ) : (
                <div className="text-center text-xs text-neutral-400 dark:text-zinc-500 py-10 font-bold">
                  Pilih resi untuk melihat detail
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Welcome Tutorial Modal */}
      <TutorialModal
        storageKey="bagaskara-tutorial-resi"
        badge="Tutorial Lacak Paket"
        title="Cara Lacak Pengiriman Anda"
        steps={[
          {
            icon: "📦",
            title: "Pilih Ekspedisi / Kurir",
            description: "Klik dropdown kurir untuk memilih ekspedisi pengiriman paket Anda. Kami mendukung lebih dari 20 kurir populer termasuk J&T, Shopee Express, Sicepat, dan JNE."
          },
          {
            icon: "🔢",
            title: "Masukkan Nomor Resi",
            description: "Salin dan tempel nomor resi (AWB) yang diberikan oleh admin Bagaskara Cell ke dalam kolom input resi pengiriman."
          },
          {
            icon: "⚡",
            title: "Lacak Banyak Resi Sekaligus",
            description: "Klik 'Tambah Resi Lain' jika Anda ingin melacak beberapa paket sekaligus secara bersamaan dan real-time dalam satu halaman."
          }
        ]}
      />
    </div>
  );
}

// Beautiful layout skeleton for per-tab loading states
function ResultSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-zinc-800/80">
        <div className="space-y-1.5 w-1/3">
          <div className="h-2.5 bg-neutral-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-4 bg-neutral-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-6 w-20 bg-neutral-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="h-10 bg-neutral-200 dark:bg-zinc-800 rounded-xl" />
      <div className="h-44 bg-neutral-200 dark:bg-zinc-800 rounded-3xl" />
    </div>
  );
}
