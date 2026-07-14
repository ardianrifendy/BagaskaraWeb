import React from "react";

type BadgeType = "baru" | "second" | "like-new" | "ready" | "habis" | "po";

interface BadgeProps {
  type: BadgeType;
  className?: string;
}

export default function Badge({ type, className = "" }: BadgeProps) {
  let label = "";
  let styles = "";

  switch (type) {
    case "baru":
      label = "Baru";
      styles = "bg-orange-50 text-orange-700 border-orange-200";
      break;
    case "like-new":
      label = "Like New";
      styles = "bg-sky-50 text-sky-700 border-sky-200";
      break;
    case "second":
      label = "Second";
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "ready":
      label = "Ready";
      styles = "bg-emerald-600 text-white border-transparent";
      break;
    case "habis":
      label = "Habis";
      styles = "bg-neutral-100 text-neutral-400 border-neutral-200 line-through";
      break;
    case "po":
      label = "Pesan PO";
      styles = "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30";
      break;
  }

  // Stock status ready/habis is usually solid or has different font-weight
  const isStock = type === "ready" || type === "habis" || type === "po";
  const baseStyles = isStock
    ? "inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold tracking-wide border uppercase"
    : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";

  return (
    <span className={`${baseStyles} ${styles} ${className}`}>
      {isStock && type === "ready" && (
        <span className="w-1.5 h-1.5 mr-1 bg-white rounded-full animate-pulse inline-block" />
      )}
      {isStock && type === "po" && (
        <span className="w-1.5 h-1.5 mr-1 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse inline-block" />
      )}
      {label}
    </span>
  );
}
