"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatRupiah } from "@/lib/formatRupiah";
import Select from "@/components/jastip/Select";

interface Batch {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  currency: string;
  exchangeRate: string;
  feeType: string;
  feeValue: string;
  orderDeadline: string | null;
  eta: string | null;
  status: "open" | "closed" | "shipping" | "done";
}

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("MY");
  const [currency, setCurrency] = useState("MYR");
  const [exchangeRate, setExchangeRate] = useState("");
  const [feeType, setFeeType] = useState<"flat" | "percent">("flat");
  const [feeValue, setFeeValue] = useState("");
  const [orderDeadline, setOrderDeadline] = useState("");
  const [eta, setEta] = useState("");
  const [status, setStatus] = useState<"open" | "closed" | "shipping" | "done">("open");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jastip/admin/batches");
      const data = await res.json();
      if (data.ok) {
        setBatches(data.batches || []);
      } else {
        setError(data.error || "Gagal memuat data batch.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setSlug("");
    setName("");
    setCountryCode("MY");
    setCurrency("MYR");
    setExchangeRate("");
    setFeeType("flat");
    setFeeValue("15000");
    setOrderDeadline("");
    setEta("");
    setStatus("open");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setSlug(batch.slug);
    setName(batch.name);
    setCountryCode(batch.countryCode);
    setCurrency(batch.currency);
    setExchangeRate(Number(batch.exchangeRate).toString());
    setFeeType(batch.feeType as "flat" | "percent");
    setFeeValue(Number(batch.feeValue).toString());
    setOrderDeadline(batch.orderDeadline || "");
    setEta(batch.eta || "");
    setStatus(batch.status);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      slug: slug.trim(),
      name: name.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      currency: currency.trim().toUpperCase(),
      exchangeRate: Number(exchangeRate),
      feeType,
      feeValue: Number(feeValue),
      orderDeadline: orderDeadline || null,
      eta: eta || null,
      status,
    };

    try {
      const url = editingBatch
        ? `/api/jastip/admin/batches/${editingBatch.id}`
        : "/api/jastip/admin/batches";
      const method = editingBatch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        setIsFormOpen(false);
        fetchBatches();
      } else {
        setError(data.error || "Gagal menyimpan batch.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-150 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <Link href="/jastip/admin/orders" className="text-neutral-500 hover:text-orange-600 dark:text-zinc-400">
              Orders
            </Link>
            <Link href="/jastip/admin/batches" className="text-orange-600 dark:text-orange-400">
              Batches
            </Link>
            <Link href="/jastip" className="text-neutral-450 hover:text-neutral-600 text-[10px]">
              Lacak Publik
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Manajemen Batch Jastip</h1>
            <p className="text-xs text-neutral-450 dark:text-zinc-550 mt-0.5">
              Atur kuota kurs, fee jastip, serta tanggal deadline pengiriman jastip.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-md"
          >
            + Batch Baru
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-650 dark:text-red-400">
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-neutral-400 dark:text-zinc-550">
            Memuat daftar batch...
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block">
                        Slug: {b.slug}
                      </span>
                      <h3 className="font-black text-base text-neutral-850 dark:text-zinc-150">
                        {b.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        b.status === "open"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : b.status === "closed"
                          ? "bg-neutral-100 text-neutral-600 border border-neutral-200"
                          : b.status === "shipping"
                          ? "bg-orange-50 text-orange-700 border border-orange-200 animate-pulse"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      Negara / Kurs:{" "}
                      <strong className="font-semibold text-neutral-850 dark:text-zinc-200">
                        {b.countryCode} ({b.currency})
                      </strong>
                    </div>
                    <div>
                      Nilai Kurs:{" "}
                      <strong className="font-semibold text-neutral-850 dark:text-zinc-200">
                        {formatRupiah(Number(b.exchangeRate))}
                      </strong>
                    </div>
                    <div>
                      Komisi Jastip:{" "}
                      <strong className="font-semibold text-neutral-850 dark:text-zinc-200">
                        {b.feeType === "flat"
                          ? `${formatRupiah(Number(b.feeValue))} flat`
                          : `${b.feeValue}%`}
                      </strong>
                    </div>
                    <div>
                      Deadline:{" "}
                      <strong className="font-semibold text-neutral-850 dark:text-zinc-200">
                        {b.orderDeadline || "-"}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      Estimasi Tiba (ETA):{" "}
                      <strong className="font-semibold text-neutral-850 dark:text-zinc-200">
                        {b.eta || "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-neutral-50 dark:border-zinc-800/80 pt-3">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="px-3 py-1.5 border border-neutral-200 dark:border-zinc-700 hover:border-neutral-450 dark:hover:border-zinc-650 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Edit Batch
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl text-xs font-bold text-neutral-400 dark:text-zinc-550">
            Belum ada batch yang terdaftar. Buat batch pertama Anda!
          </div>
        )}
      </main>

      {/* Create / Edit Batch Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800/80 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider">
                {editingBatch ? "Edit Batch Jastip" : "Buat Batch Baru"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Slug Batch (Unique)
                  </label>
                  <input
                    type="text"
                    placeholder="my-sep-2026"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Nama Batch
                  </label>
                  <input
                    type="text"
                    placeholder="Batch Malaysia September 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Kode Negara (2 huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="MY"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Mata Uang (3 huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="MYR"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Kurs IDR
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="3500"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <Select
                  label="Jenis Fee"
                  value={feeType}
                  onChange={(val) => setFeeType(val as "flat" | "percent")}
                  options={[
                    { value: "flat", label: "Flat (Rp)" },
                    { value: "percent", label: "Persen (%)" },
                  ]}
                  className="w-full"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Nilai Fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="15000"
                    value={feeValue}
                    onChange={(e) => setFeeValue(e.target.value)}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Deadline Order (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={orderDeadline}
                    onChange={(e) => setOrderDeadline(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    ETA Tiba (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <Select
                label="Status Batch"
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                  { value: "shipping", label: "Shipping" },
                  { value: "done", label: "Done" },
                ]}
                className="w-full"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : "Simpan Batch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
