import { getCourierLabel } from "@/lib/couriers";
import type { TrackingResult } from "@/types/tracking";

interface CekResiResultProps {
  result: TrackingResult;
}

export default function CekResiResult({ result }: CekResiResultProps) {
  const { summary, detail, history } = result;

  const isDelivered = summary.status.toLowerCase().includes("delivered") || 
                      summary.status.toLowerCase().includes("diterima") ||
                      summary.status.toLowerCase().includes("sukses");

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-zinc-800/80 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-zinc-500">
              {getCourierLabel(summary.courier)} · {summary.service || "Regular"}
            </span>
            <h3 className="text-sm md:text-base font-extrabold text-neutral-800 dark:text-zinc-150 mt-0.5">
              {summary.awb}
            </h3>
          </div>
          <span className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider ${
            isDelivered
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-200/50 dark:border-emerald-900/30"
              : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-450 border border-orange-200/50 dark:border-orange-900/30"
          }`}>
            {summary.status}
          </span>
        </div>

        {/* Highlighted Last Description */}
        <div className="mt-4 p-3 bg-neutral-50 dark:bg-zinc-950/30 rounded-2xl border border-neutral-100/50 dark:border-zinc-850 text-xs md:text-sm font-bold text-neutral-700 dark:text-zinc-350">
          <p className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Status Terakhir</p>
          {summary.lastDesc}
        </div>

        {/* Package Metadata Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 dark:border-zinc-800/80 pt-4 text-xs font-bold text-neutral-500 dark:text-zinc-400">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-0.5">Asal</dt>
            <dd className="text-neutral-700 dark:text-zinc-300 break-words">{detail.origin || "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-0.5">Tujuan</dt>
            <dd className="text-neutral-700 dark:text-zinc-300 break-words">{detail.destination || "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-0.5">Penerima</dt>
            <dd className="text-neutral-700 dark:text-zinc-300 break-words">{summary.receiver || "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-0.5">Berat</dt>
            <dd className="text-neutral-700 dark:text-zinc-300 break-words">{summary.weight ? `${summary.weight} Kg` : "-"}</dd>
          </div>
        </dl>
      </div>

      {/* History Timeline */}
      <div className="relative pl-6 border-l-2 border-neutral-200/80 dark:border-zinc-800 space-y-6 ml-3">
        {history.map((item, index) => {
          const isLatest = index === 0;
          return (
            <div key={`${item.date}-${index}`} className="relative group">
              {/* Timeline Indicator Node */}
              <span
                className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full flex items-center justify-center transition-all ${
                  isLatest
                    ? "bg-orange-500 ring-4 ring-orange-500/20 dark:ring-orange-500/30 scale-110"
                    : "bg-neutral-300 dark:bg-zinc-700 group-hover:bg-neutral-400 dark:group-hover:bg-zinc-500"
                }`}
              >
                {isLatest && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
              </span>

              {/* Checkpoint Detail */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500 tracking-wide uppercase">
                  {item.date}
                </span>
                <p className={`text-xs md:text-sm font-bold leading-relaxed ${
                  isLatest ? "text-neutral-800 dark:text-zinc-200" : "text-neutral-600 dark:text-zinc-400"
                }`}>
                  {item.desc}
                </p>
                {item.location && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    <svg className="w-3 h-3 text-neutral-400 dark:text-zinc-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {item.location}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
