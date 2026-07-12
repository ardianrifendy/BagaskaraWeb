import React from "react";

interface ScenarioBarProps {
  up: number;
  sideways: number;
  down: number;
}

export default function ScenarioBar({ up, sideways, down }: ScenarioBarProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-zinc-200">
          Probabilitas Pergerakan Pasar
        </h3>
        <span className="text-[10px] font-extrabold text-neutral-450 uppercase">Horizon 7 Hari</span>
      </div>

      <div className="space-y-3">
        {/* Three Segment ProgressBar */}
        <div className="w-full h-8 rounded-xl overflow-hidden flex bg-neutral-100 dark:bg-zinc-800 border border-neutral-200/50 dark:border-zinc-800 shadow-inner">
          {up > 0 && (
            <div 
              style={{ width: `${up}%` }} 
              className="bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center text-white font-black text-xs transition-all duration-500 shadow-sm"
              title={`Bias Naik: ${up}%`}
            >
              {up >= 15 ? `${up}%` : ""}
            </div>
          )}
          {sideways > 0 && (
            <div 
              style={{ width: `${sideways}%` }} 
              className="bg-neutral-350 dark:bg-zinc-550 flex items-center justify-center text-neutral-700 dark:text-zinc-200 font-black text-xs transition-all duration-500"
              title={`Sideways: ${sideways}%`}
            >
              {sideways >= 15 ? `${sideways}%` : ""}
            </div>
          )}
          {down > 0 && (
            <div 
              style={{ width: `${down}%` }} 
              className="bg-rose-500 dark:bg-rose-600 flex items-center justify-center text-white font-black text-xs transition-all duration-500 shadow-sm"
              title={`Bias Turun: ${down}%`}
            >
              {down >= 15 ? `${down}%` : ""}
            </div>
          )}
        </div>

        {/* Legend Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-450">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              📈 Bias Naik
            </span>
            <span className="text-xs font-black text-neutral-750 dark:text-zinc-300 mt-0.5">{up}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 dark:text-zinc-400">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-350 dark:bg-zinc-550"></span>
              ➡️ Sideways
            </span>
            <span className="text-xs font-black text-neutral-750 dark:text-zinc-300 mt-0.5">{sideways}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-455">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              📉 Bias Turun
            </span>
            <span className="text-xs font-black text-neutral-750 dark:text-zinc-300 mt-0.5">{down}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}