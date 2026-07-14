"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatRupiah } from "@/lib/formatRupiah";
import Select from "@/components/jastip/Select";

interface Batch {
  id: number;
  name: string;
}

interface OrderItem {
  id: number;
  name: string;
  qty: number;
  estPrice: string;
  actualPrice: string | null;
  status: string;
}

interface Order {
  id: number;
  code: string;
  customerName: string;
  customerWa: string;
  paymentStatus: "unpaid" | "dp" | "paid";
  notesPublic: string | null;
  resi: string | null;
  courier: string | null;
  createdAt: string;
  batch: {
    id: number;
    name: string;
    exchangeRate: string;
    feeType: string;
    feeValue: string;
  };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search states
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Create Order Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "dp" | "paid">("unpaid");
  const [notesPublic, setNotesPublic] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch orders when search or filters change
  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedBatch, selectedPaymentStatus]);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/jastip/admin/batches");
      const data = await res.json();
      if (data.ok) {
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Gagal mengambil batches:", err);
    }
  };

  const fetchOrders = async (resetCursor = false, currentCursor: number | null = null) => {
    setLoading(true);
    setError(null);

    const activeCursor = resetCursor ? null : (currentCursor !== null ? currentCursor : cursor);

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedBatch) params.set("batchId", selectedBatch);
    if (selectedPaymentStatus) params.set("paymentStatus", selectedPaymentStatus);
    if (activeCursor) params.set("cursor", activeCursor.toString());

    try {
      const res = await fetch(`/api/jastip/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        if (resetCursor) {
          setOrders(data.orders || []);
        } else {
          setOrders((prev) => [...prev, ...(data.orders || [])]);
        }
        setCursor(data.nextCursor);
        setHasNextPage(data.hasNextPage);
      } else {
        setError(data.error || "Gagal memuat orders.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (batches.length === 0) {
      alert("Buat batch jastip terlebih dahulu sebelum membuat order!");
      return;
    }
    setBatchId(batches[0].id.toString());
    setCustomerName("");
    setCustomerWa("");
    setPaymentStatus("unpaid");
    setNotesPublic("");
    setNotesInternal("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      batchId: parseInt(batchId),
      customerName: customerName.trim(),
      customerWa: customerWa.trim(),
      paymentStatus,
      notesPublic: notesPublic.trim() || null,
      notesInternal: notesInternal.trim() || null,
    };

    try {
      const res = await fetch("/api/jastip/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        setIsFormOpen(false);
        fetchOrders(true);
      } else {
        setError(data.error || "Gagal menyimpan order.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate order total cost helper
  const getOrderTotal = (order: Order) => {
    let total = 0;
    const rate = Number(order.batch.exchangeRate) || 0;
    const feeVal = Number(order.batch.feeValue) || 0;

    for (const item of order.items) {
      const isZero = ["cancelled", "out_of_stock"].includes(item.status);
      if (isZero) continue;

      const price = item.actualPrice !== null ? Number(item.actualPrice) : Number(item.estPrice);
      const basePriceIdr = price * rate * item.qty;
      const feeIdr = order.batch.feeType === "percent" ? basePriceIdr * (feeVal / 100) : feeVal * item.qty;
      total += basePriceIdr + feeIdr;
    }
    return total;
  };

  return (
    <div className="min-h-screen bg-neutral-150 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <Link href="/jastip/admin/orders" className="text-orange-600 dark:text-orange-400">
              Orders
            </Link>
            <Link href="/jastip/admin/batches" className="text-neutral-500 hover:text-orange-600 dark:text-zinc-400">
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Daftar Pesanan Jastip</h1>
            <p className="text-xs text-neutral-450 dark:text-zinc-550 mt-0.5">
              Kelola pesanan jastip masuk, update status barang, dan pembayarannya.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-md self-start sm:self-auto"
          >
            + Buat Order Baru
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              Cari Nama / Kode Order
            </label>
            <input
              type="text"
              placeholder="Cari kode JST-... atau nama pelanggan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800/80 rounded-xl text-xs md:text-sm font-bold w-full"
            />
          </div>

          <Select
            label="Filter Batch"
            value={selectedBatch}
            onChange={(val) => setSelectedBatch(val)}
            options={[
              { value: "", label: "Semua Batch" },
              ...batches.map((b) => ({ value: b.id.toString(), label: b.name })),
            ]}
            className="w-full md:w-48"
          />

          <Select
            label="Status Bayar"
            value={selectedPaymentStatus}
            onChange={(val) => setSelectedPaymentStatus(val)}
            options={[
              { value: "", label: "Semua Status" },
              { value: "unpaid", label: "Belum Bayar (Unpaid)" },
              { value: "dp", label: "DP Masuk (DP)" },
              { value: "paid", label: "Lunas (Paid)" },
            ]}
            className="w-full md:w-48"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-650 dark:text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Orders Table / List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950/30 text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-550">
                      <th className="p-4">Kode Order</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Total Biaya</th>
                      <th className="p-4">Status Bayar</th>
                      <th className="p-4">Barang</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-850/35 text-neutral-700 dark:text-zinc-350">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-850/10">
                        <td className="p-4 font-black text-neutral-850 dark:text-zinc-150">
                          <Link href={`/jastip/admin/orders/${o.id}`} className="hover:text-orange-600 hover:underline">
                            {o.code}
                          </Link>
                        </td>
                        <td className="p-4 font-medium text-[11px] truncate max-w-[120px]">
                          {o.batch.name}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-neutral-850 dark:text-zinc-150">
                            {o.customerName}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-medium">
                            {o.customerWa}
                          </div>
                        </td>
                        <td className="p-4 font-black text-neutral-850 dark:text-zinc-150">
                          {formatRupiah(getOrderTotal(o))}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              o.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : o.paymentStatus === "dp"
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-neutral-800 dark:text-zinc-200">
                            {o.items.length} items
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            href={`/jastip/admin/orders/${o.id}`}
                            className="inline-block px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 font-bold rounded-lg transition"
                          >
                            Kelola
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Load More */}
            {hasNextPage && (
              <div className="text-center pt-2">
                <button
                  onClick={() => fetchOrders(false, cursor)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-250 dark:border-zinc-800 hover:border-neutral-400 text-neutral-600 dark:text-zinc-300 hover:text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? "Memuat..." : "Tampilkan Lebih Banyak"}
                </button>
              </div>
            )}
          </div>
        ) : !loading ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl text-xs font-bold text-neutral-400 dark:text-zinc-550 animate-fade-in">
            Tidak ada pesanan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="text-center py-12 text-xs font-bold text-neutral-400 dark:text-zinc-550 animate-pulse">
            Memuat daftar pesanan...
          </div>
        )}
      </main>

      {/* Create Order Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800/80 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider">Buat Pesanan Jastip Baru</h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Pilih Batch Jastip"
                value={batchId}
                onChange={(val) => setBatchId(val)}
                options={batches.map((b) => ({ value: b.id.toString(), label: b.name }))}
                className="w-full"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    No. WhatsApp (Lengkap)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 6289513679939"
                    value={customerWa}
                    onChange={(e) => setCustomerWa(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <Select
                label="Status Pembayaran Awal"
                value={paymentStatus}
                onChange={(val) => setPaymentStatus(val as any)}
                options={[
                  { value: "unpaid", label: "Belum Bayar (Unpaid)" },
                  { value: "dp", label: "DP Masuk (DP)" },
                  { value: "paid", label: "Lunas (Paid)" },
                ]}
                className="w-full"
              />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Catatan untuk Pelanggan (Publik)
                </label>
                <textarea
                  placeholder="Catatan yang bisa dilihat pelanggan di halaman tracking..."
                  value={notesPublic}
                  onChange={(e) => setNotesPublic(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold h-16 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Catatan Internal Toko (Secret)
                </label>
                <textarea
                  placeholder="Catatan rahasia admin toko (tidak bocor ke publik)..."
                  value={notesInternal}
                  onChange={(e) => setNotesInternal(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Memproses..." : "Simpan & Generate Kode"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
