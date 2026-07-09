import React from "react";
import { buildWaLink } from "../lib/buildWaLink";

interface WhatsAppButtonProps {
  productName?: string;
  color?: string;
  storage?: string;
  price?: number;
  label?: string;
  className?: string;
  variant?: "solid" | "outline";
  isScraped?: boolean;
}

export default function WhatsAppButton({
  productName,
  color,
  storage,
  price,
  label = "Tanya via WA",
  className = "",
  variant = "solid",
  isScraped = false
}: WhatsAppButtonProps) {
  const link = buildWaLink(productName, color, storage, price, isScraped);

  const focusRingStyle = isScraped 
    ? "focus:ring-orange-500" 
    : "focus:ring-emerald-500";

  const baseStyle =
    `inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 ${focusRingStyle} focus:ring-offset-2 cursor-pointer`;
  
  let variantStyle = "";
  if (isScraped) {
    variantStyle = variant === "solid"
      ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-200"
      : "border border-orange-600 text-orange-750 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20";
  } else {
    variantStyle = variant === "solid"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
      : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20";
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      <svg
        className="w-4.5 h-4.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
      </svg>
      {label}
    </a>
  );
}
