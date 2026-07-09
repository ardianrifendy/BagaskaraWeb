"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Product } from "../types/product";
import ProductDetails from "./ProductDetails";

interface ProductDetailsModalProps {
  product: Product;
}

export default function ProductDetailsModal({ product }: ProductDetailsModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Prevent body scrolling when the modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("produk");
    // Clean up query param and replace state in Next.js router
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-6"
      onClick={handleClose}
    >
      <div 
        className="relative bg-white dark:bg-black w-full max-w-4xl rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[95vh] md:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // prevent close on internal click
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:text-neutral-850 dark:hover:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title="Tutup"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable details wrapper */}
        <div className="overflow-y-auto flex-1">
          <ProductDetails product={product} isModal={true} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}
