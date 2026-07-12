import React from "react";

interface AnalysisNarrativeProps {
  narrative?: string;
  loading: boolean;
  error?: string;
  generatedAt?: string;
}

export default function AnalysisNarrative({
  narrative,
  loading,
  error,
  generatedAt
}: AnalysisNarrativeProps) {
  const formatWibDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      // Format WIB (UTC+7) menggunakan Jakarta locale
      const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta"
      }).format(date);
      return `Dianalisis: ${formatted} WIB`;
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-850 pb-2.5 select-none">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-zinc-200">
          Tinjauan & Narasi Analis AI
        </h3>
        <span className="text-[9px] font-extrabold text-neutral-450 uppercase">Ekonom-Statistikawan</span>
      </div>

      <div className="pt-1">
        {loading ? (
          <div className="space-y-2.5 py-2 animate-pulse">
            <div className="h-3.5 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-full"></div>
            <div className="h-3.5 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-[95%]"></div>
            <div className="h-3.5 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-[88%]"></div>
            <div className="h-3.5 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-[92%]"></div>
            <div className="h-3.5 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-[50%]"></div>
          </div>
        ) : error ? (
          <p className="text-xs text-neutral-500 dark:text-zinc-450 leading-relaxed italic text-center py-4">
            {error === "AI_DISABLED" 
              ? "Narasi asisten AI di-nonaktifkan di server." 
              : "Gagal memuat narasi AI analis pasar."}
          </p>
        ) : narrative ? (
          <div className="space-y-3.5">
            <p className="text-xs md:text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed font-medium">
              {narrative}
            </p>
            {generatedAt && (
              <span className="text-[10px] font-extrabold text-neutral-400 dark:text-zinc-550 block select-none">
                {formatWibDate(generatedAt)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 dark:text-zinc-450 leading-relaxed italic text-center py-4 select-none">
            Pilih aset untuk memuat narasi AI analis.
          </p>
        )}
      </div>
    </div>
  );
}