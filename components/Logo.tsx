/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { siteConfig } from "../config/site";
import Link from "next/link";

export default function Logo() {
  const [logoError, setLogoError] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect theme class on <html> element
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Set initial theme state
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    return () => observer.disconnect();
  }, []);

  const logoSrc = theme === "dark" ? siteConfig.logoDark : siteConfig.logoLight;

  if (logoError) {
    return (
      <Link href="https://bagaskaracell.net" className="flex items-center gap-2 select-none cursor-pointer">
        <span className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-orange-200">
          B
        </span>
        <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-zinc-100">
          {siteConfig.name}
        </span>
      </Link>
    );
  }

  return (
    <Link href="https://bagaskaracell.net" className="flex items-center h-12 select-none cursor-pointer">
      <img
        src={logoSrc}
        alt={siteConfig.name}
        className="h-9 md:h-11 w-auto object-contain"
        onError={() => setLogoError(true)}
      />
    </Link>
  );
}
