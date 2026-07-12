"use client";

import { useState } from "react";
import UrlForm from "@/components/media-downloader/UrlForm";
import ResultCard from "@/components/media-downloader/ResultCard";
import type { MediaApiResponse, MediaResult } from "@/lib/media-downloader/types";

type Status = "idle" | "loading" | "success" | "error";

export default function MediaDownloaderClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<MediaResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(url: string) {
    setStatus("loading");
    setResult(null);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/media-downloader/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const body: MediaApiResponse = await response.json();

      if (body.ok) {
        setResult(body);
        setStatus("success");
      } else {
        setErrorMsg(body.message);
        setStatus("error");
      }
    } catch {
      setErrorMsg("Gagal menghubungkan ke server. Coba lagi.");
      setStatus("error");
    }
  }

  return (
    <div className="w-full">
      <UrlForm onSubmit={submit} loading={status === "loading"} />

      {status === "error" && errorMsg && (
        <div className="mt-4 rounded-3xl border border-red-100 dark:border-red-950/30 bg-red-50/40 dark:bg-red-950/10 p-5 flex items-start gap-3.5 animate-in fade-in duration-200">
          <svg className="w-6 h-6 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs md:text-sm font-bold text-red-800 dark:text-red-400 leading-relaxed pt-0.5">
            {errorMsg}
          </p>
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-4">
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
}
