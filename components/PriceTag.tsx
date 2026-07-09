import React from "react";
import { formatRupiah as rupiahFormatter } from "../lib/formatRupiah";

interface PriceTagProps {
  price: number;
  strikePrice?: number;
  className?: string;
  priceClassName?: string;
  strikeClassName?: string;
}

export default function PriceTag({
  price,
  strikePrice,
  className = "",
  priceClassName = "",
  strikeClassName = ""
}: PriceTagProps) {
  return (
    <div className={`flex flex-wrap items-baseline gap-1.5 ${className}`}>
      <span className={`text-base md:text-lg font-extrabold text-orange-600 ${priceClassName}`}>
        {rupiahFormatter(price)}
      </span>
      {strikePrice && strikePrice > price && (
        <span className={`text-xs md:text-sm text-neutral-400 line-through ${strikeClassName}`}>
          {rupiahFormatter(strikePrice)}
        </span>
      )}
    </div>
  );
}
