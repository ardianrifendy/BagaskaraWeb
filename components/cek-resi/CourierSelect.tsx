"use client";

import { SUPPORTED_COURIERS } from "@/lib/couriers";
import type { CourierCode } from "@/types/tracking";

interface CourierSelectProps {
  value: CourierCode | "";
  onChange: (value: CourierCode | "") => void;
  disabled?: boolean;
}

export default function CourierSelect({ value, onChange, disabled }: CourierSelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
        Pilih Kurir
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CourierCode | "")}
        disabled={disabled}
        required
        aria-label="Pilih kurir"
        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
      >
        <option value="" disabled className="text-neutral-400 dark:text-zinc-600">
          Pilih kurir pengiriman...
        </option>
        {SUPPORTED_COURIERS.map((courier) => (
          <option key={courier.code} value={courier.code} className="dark:bg-zinc-900">
            {courier.label}
          </option>
        ))}
      </select>
    </div>
  );
}
