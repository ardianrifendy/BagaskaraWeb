"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatRupiah } from "@/lib/formatRupiah";

interface Batch {
  id: number;
  name: string;
}

interface OrderItem {
  id: number;
  name: string;
  variant: string | null;
  qty: number;
  estPrice: string;
  actualPrice: string | null;
  weightGrams: number | null;
  status: "requested" | "hunting" | "found" | "purchased" | "warehouse" | "shipped" | "out_of_stock" | "cancelled";
  substitutionOk: boolean;
  proofUrl: string | null;
  note: string | null;
}

interface Payment {
  id: number;
  amountIdr: string;
  type: "dp" | "pelunasan" | "refund";
  paidAt: string;
  note: string | null;
}

interface StatusLog {
  id: number;
  itemId: number | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

interface OrderDetails {
  id: number;
  code: string;
  batchId: number;
  customerName: string;
  customerWa: string;
  paymentStatus: "unpaid" | "dp" | "paid";
  notesPublic: string | null;
  notesInternal: string | null;
  resi: string | null;
  courier: string | null;
  createdAt: string;
  batch: {
    id: number;
    name: string;
    currency: string;
    countryCode: string;
    exchangeRate: string;
    feeType: string;
    feeValue: string;
  };
  items: OrderItem[];
  payments: Payment[];
  statusLogs: StatusLog[];
}

function OrderDetailsContent() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = parseInt(id as string);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order fields edit state
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [batchId, setBatchId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "dp" | "paid">("unpaid");
  const [notesPublic, setNotesPublic] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [resi, setResi] = useState("");
  const [courier, setCourier] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  // Item Modal & Form state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemVariant, setItemVariant] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemEstPrice, setItemEstPrice] = useState("");
  const [itemActualPrice, setItemActualPrice] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemStatus, setItemStatus] = useState<OrderItem["status"]>("requested");
  const [itemSubOk, setItemSubOk] = useState(false);
  const [itemProofUrl, setItemProofUrl] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Payment Form state
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<"dp" | "pelunasan" | "refund">("dp");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNote, setPayNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (isNaN(orderId)) return;
    fetchOrderDetails();
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jastip/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.ok && data.order) {
        const o: OrderDetails = data.order;
        setOrder(o);
        setCustomerName(o.customerName);
        setCustomerWa(o.customerWa);
        setBatchId(o.batchId.toString());
        setPaymentStatus(o.paymentStatus);
        setNotesPublic(o.notesPublic || "");
        setNotesInternal(o.notesInternal || "");
        setResi(o.resi || "");
        setCourier(o.courier || "");
      } else {
        setError(data.error || "Gagal memuat order.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/jastip/admin/batches");
      const data = await res.json();
      if (data.ok) {
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Gagal memuat batches:", err);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrder(true);
    setError(null);

    const payload = {
      batchId: parseInt(batchId),
      customerName: customerName.trim(),
      customerWa: customerWa.trim(),
      paymentStatus,
      notesPublic: notesPublic.trim() || null,
      notesInternal: notesInternal.trim() || null,
      resi: resi.trim() || null,
      courier: courier.trim() || null,
    };

    try {
      const res = await fetch(`/api/jastip/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        fetchOrderDetails();
        alert("Pesanan berhasil diperbarui!");
      } else {
        setError(data.error || "Gagal memperbarui pesanan.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      console.error(err);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen?")) return;

    try {
      const res = await fetch(`/api/jastip/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/jastip/admin/orders");
      } else {
        alert(data.error || "Gagal menghapus order.");
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
      alert("Gagal menghubungi server.");
    }
  };

  // Item modal triggers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName("");
    setItemVariant("");
    setItemQty(1);
    setItemEstPrice("");
    setItemActualPrice("");
    setItemWeight("");
    setItemStatus("requested");
    setItemSubOk(false);
    setItemProofUrl("");
    setItemNote("");
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: OrderItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemVariant(item.variant || "");
    setItemQty(item.qty);
    setItemEstPrice(Number(item.estPrice).toString());
    setItemActualPrice(item.actualPrice !== null ? Number(item.actualPrice).toString() : "");
    setItemWeight(item.weightGrams !== null ? item.weightGrams.toString() : "");
    setItemStatus(item.status);
    setItemSubOk(item.substitutionOk);
    setItemProofUrl(item.proofUrl || "");
    setItemNote(item.note || "");
    setIsItemModalOpen(true);
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/jastip/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setItemProofUrl(data.url);
      } else {
        alert(data.error || "Gagal mengunggah file.");
      }
    } catch (err) {
      console.error("Gagal mengunggah:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setUploading(false);
    }
  };

  // Submit Item Form
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingItem(true);

    const payload = {
      orderId,
      name: itemName.trim(),
      variant: itemVariant.trim() || null,
      qty: itemQty,
      estPrice: Number(itemEstPrice),
      actualPrice: itemActualPrice ? Number(itemActualPrice) : null,
      weightGrams: itemWeight ? parseInt(itemWeight) : null,
      status: itemStatus,
      substitutionOk: itemSubOk,
      proofUrl: itemProofUrl || null,
      note: itemNote.trim() || null,
    };

    try {
      const url = editingItem ? `/api/jastip/admin/items/${editingItem.id}` : "/api/jastip/admin/items";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        setIsItemModalOpen(false);
        fetchOrderDetails();
      } else {
        alert(data.error || "Gagal menyimpan item.");
      }
    } catch (err) {
      console.error("Gagal menyimpan item:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item ini dari pesanan?")) return;

    try {
      const res = await fetch(`/api/jastip/admin/items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setIsItemModalOpen(false);
        fetchOrderDetails();
      } else {
        alert(data.error || "Gagal menghapus item.");
      }
    } catch (err) {
      console.error("Gagal menghapus item:", err);
      alert("Gagal menghubungi server.");
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);

    const payload = {
      orderId,
      amountIdr: Number(payAmount),
      type: payType,
      paidAt: payDate,
      note: payNote.trim() || null,
    };

    try {
      const res = await fetch("/api/jastip/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        setIsPaymentFormOpen(false);
        setPayAmount("");
        setPayNote("");
        fetchOrderDetails();
      } else {
        alert(data.error || "Gagal menyimpan pembayaran.");
      }
    } catch (err) {
      console.error("Gagal menyimpan pembayaran:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (payId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pembayaran ini?")) return;

    try {
      const res = await fetch(`/api/jastip/admin/payments/${payId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        fetchOrderDetails();
      } else {
        alert(data.error || "Gagal menghapus pembayaran.");
      }
    } catch (err) {
      console.error("Gagal menghapus pembayaran:", err);
      alert("Gagal menghubungi server.");
    }
  };

  // Calculations for billing box
  const getTotals = () => {
    if (!order) return { totalCost: 0, totalPaid: 0, sisa: 0 };

    let totalCost = 0;
    const rate = Number(order.batch.exchangeRate) || 0;
    const feeVal = Number(order.batch.feeValue) || 0;

    for (const item of order.items) {
      const isZero = ["cancelled", "out_of_stock"].includes(item.status);
      if (isZero) continue;

      const price = item.actualPrice !== null ? Number(item.actualPrice) : Number(item.estPrice);
      const basePriceIdr = price * rate * item.qty;
      const feeIdr = order.batch.feeType === "percent" ? basePriceIdr * (feeVal / 100) : feeVal * item.qty;
      totalCost += basePriceIdr + feeIdr;
    }

    const totalPaid = order.payments.reduce((acc, p) => acc + Number(p.amountIdr), 0);
    return {
      totalCost,
      totalPaid,
      sisa: totalCost - totalPaid,
    };
  };

  const totals = getTotals();

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xs font-bold text-neutral-400 dark:text-zinc-550 animate-pulse">
          Memuat rincian pesanan...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-neutral-250 dark:border-zinc-800 p-8 rounded-3xl max-w-sm text-center space-y-4">
          <div className="text-red-500 text-3xl">⚠</div>
          <h2 className="font-black text-lg">Terjadi Kesalahan</h2>
          <p className="text-xs text-neutral-450">{error || "Pesanan tidak ditemukan."}</p>
          <Link href="/jastip/admin/orders" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold">
            Kembali ke Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-150 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col pb-16">
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
            <Link href={`/jastip/track/${order.code}`} className="text-neutral-450 hover:text-neutral-600 text-[10px]">
              Lacak Publik
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Side: Order Edit Form & Billing Box (Col-span 1) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Order Header / Delete button */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4 rounded-3xl shadow-sm">
            <div>
              <span className="text-[9px] font-black uppercase text-neutral-450 tracking-widest">
                Kode Order
              </span>
              <h1 className="text-lg font-black">{order.code}</h1>
            </div>
            <button
              onClick={handleDeleteOrder}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Hapus Order
            </button>
          </div>

          {/* Billing Summary Box */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-3.5">
            <h3 className="text-xs font-black uppercase text-neutral-450 tracking-wider">
              Ringkasan Tagihan
            </h3>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-neutral-400">Total Belanja (IDR):</span>
              <span>{formatRupiah(totals.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-neutral-400">Sudah Dibayar (IDR):</span>
              <span className="text-emerald-600">{formatRupiah(totals.totalPaid)}</span>
            </div>
            <hr className="border-neutral-100 dark:border-zinc-800/80" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-neutral-400">Sisa Tagihan:</span>
              <span className={`text-base font-black ${totals.sisa <= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                {totals.sisa <= 0 ? "LUNAS ✅" : formatRupiah(totals.sisa)}
              </span>
            </div>
          </div>

          {/* Main Edit Form */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-450 tracking-wider mb-4">
              Edit Data Pesanan
            </h3>

            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Batch Jastip
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id.toString()}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  No. WhatsApp
                </label>
                <input
                  type="text"
                  value={customerWa}
                  onChange={(e) => setCustomerWa(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Status Bayar
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                >
                  <option value="unpaid">Belum Bayar (unpaid)</option>
                  <option value="dp">DP Masuk (dp)</option>
                  <option value="paid">Lunas (paid)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">
                    Kurir Lokal
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: jnt, sicepat"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">
                    Nomor Resi
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor resi..."
                    value={resi}
                    onChange={(e) => setResi(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Catatan Pelanggan (Publik)
                </label>
                <textarea
                  value={notesPublic}
                  onChange={(e) => setNotesPublic(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full h-16 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Catatan Internal (Secret)
                </label>
                <textarea
                  value={notesInternal}
                  onChange={(e) => setNotesInternal(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-xl text-xs font-bold w-full h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingOrder}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow cursor-pointer disabled:opacity-50"
              >
                {savingOrder ? "Menyimpan..." : "Update Detail Order"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Items, Payments & Logs (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items Section */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-neutral-450 tracking-wider">
                Barang Belanjaan ({order.items.length})
              </h3>
              <button
                onClick={handleOpenAddItem}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                + Tambah Item
              </button>
            </div>

            {order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-neutral-50/30 dark:bg-zinc-950/20 flex items-center justify-between gap-4 cursor-pointer hover:border-neutral-350 transition-colors"
                    onClick={() => handleOpenEditItem(item)}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-neutral-800 dark:text-zinc-150">
                          {item.name}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded font-black bg-neutral-100 dark:bg-zinc-800 border text-neutral-500">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-450 dark:text-zinc-500 mt-1 space-x-2">
                        {item.variant && <span>Varian: {item.variant}</span>}
                        <span>Qty: {item.qty} pcs</span>
                        {item.weightGrams && <span>{item.weightGrams}g</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-neutral-800 dark:text-zinc-200 block">
                        {item.actualPrice
                          ? formatRupiah(Number(item.actualPrice) * Number(order.batch.exchangeRate) * item.qty)
                          : formatRupiah(Number(item.estPrice) * Number(order.batch.exchangeRate) * item.qty)}
                      </span>
                      {item.proofUrl && (
                        <span className="text-[9px] text-emerald-600 font-extrabold block">
                          ✓ Ada Foto Bukti
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-bold text-neutral-400 dark:text-zinc-550 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
                Belum ada barang belanjaan yang dimasukkan.
              </div>
            )}
          </div>

          {/* Payments Section */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-neutral-450 tracking-wider">
                Catatan Riwayat Pembayaran ({order.payments.length})
              </h3>
              <button
                onClick={() => setIsPaymentFormOpen(!isPaymentFormOpen)}
                className="px-3 py-1.5 border border-neutral-200 dark:border-zinc-700 hover:border-neutral-450 hover:bg-neutral-50 text-neutral-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50 font-bold text-xs uppercase rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                {isPaymentFormOpen ? "Tutup Form" : "+ Tambah Bayar"}
              </button>
            </div>

            {/* Inline Payment Form */}
            {isPaymentFormOpen && (
              <form
                onSubmit={handleSubmitPayment}
                className="p-4 rounded-2xl border border-orange-100 dark:border-orange-950/20 bg-orange-50/20 dark:bg-orange-950/5 space-y-3.5"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">Nominal IDR</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Nominal..."
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      className="px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-lg text-xs font-bold w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">Tipe</label>
                    <select
                      value={payType}
                      onChange={(e) => setPayType(e.target.value as any)}
                      className="px-2 py-1.5 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-lg text-xs font-bold w-full"
                    >
                      <option value="dp">DP (Down Payment)</option>
                      <option value="pelunasan">Pelunasan (Sisa)</option>
                      <option value="refund">Refund (Dana Kembali)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">Tanggal Bayar</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                      className="px-2.5 py-1 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-lg text-xs font-bold w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500">Catatan Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Transfer BCA, cash..."
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-lg text-xs font-bold w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </form>
            )}

            {order.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-zinc-800 text-[10px] font-black uppercase text-neutral-450 tracking-wider">
                      <th className="pb-2">Tanggal</th>
                      <th className="pb-2">Nominal</th>
                      <th className="pb-2">Tipe</th>
                      <th className="pb-2">Catatan</th>
                      <th className="pb-2 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-zinc-850/20 text-neutral-700 dark:text-zinc-350">
                    {order.payments.map((p) => (
                      <tr key={p.id} className="align-middle">
                        <td className="py-2.5 font-semibold">{p.paidAt}</td>
                        <td className="py-2.5 font-black text-neutral-850 dark:text-zinc-150">
                          {formatRupiah(Number(p.amountIdr))}
                        </td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded font-black text-[9px] uppercase bg-neutral-100 dark:bg-zinc-800 border text-neutral-550">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-neutral-450 dark:text-zinc-500 italic">
                          {p.note || "-"}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs font-bold text-neutral-400 dark:text-zinc-550">
                Belum ada transaksi pembayaran yang dicatat.
              </div>
            )}
          </div>

          {/* Audit Logs Section */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-neutral-450 tracking-wider">
              Log Perubahan Status (Audit Trail)
            </h3>

            {order.statusLogs.length > 0 ? (
              <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                {order.statusLogs.map((log) => (
                  <div key={log.id} className="text-[11px] leading-relaxed border-l-2 border-orange-500 pl-3 py-0.5">
                    <span className="font-extrabold text-neutral-800 dark:text-zinc-200">
                      {log.field === "payment_status" ? "Status Pembayaran" : `Status Barang (ID #${log.itemId})`}
                    </span>{" "}
                    diubah dari <span className="line-through text-neutral-450">{log.oldValue}</span> menjadi{" "}
                    <strong className="text-orange-600 dark:text-orange-400 font-semibold">{log.newValue}</strong>.
                    <span className="text-[9px] text-neutral-400 dark:text-zinc-550 block mt-0.5">
                      {new Date(log.changedAt).toLocaleString("id-ID")} WIB
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs font-medium text-neutral-400 dark:text-zinc-550">
                Belum ada perubahan status yang dicatat.
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Item Create / Edit Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800/80 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider">
                {editingItem ? "Edit Item Belanjaan" : "Tambah Item Belanjaan"}
              </h2>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Nama Item
                </label>
                <input
                  type="text"
                  placeholder="Nama barang..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Varian / Warna
                  </label>
                  <input
                    type="text"
                    placeholder="Clear Case, M, Merah..."
                    value={itemVariant}
                    onChange={(e) => setItemVariant(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value)))}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Harga Est ({order.batch.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10.00"
                    value={itemEstPrice}
                    onChange={(e) => setItemEstPrice(e.target.value)}
                    required
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Harga Akt ({order.batch.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Bila sudah dibeli..."
                    value={itemActualPrice}
                    onChange={(e) => setItemActualPrice(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Berat (Gram)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Gram..."
                    value={itemWeight}
                    onChange={(e) => setItemWeight(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Status Item
                  </label>
                  <select
                    value={itemStatus}
                    onChange={(e) => setItemStatus(e.target.value as any)}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                  >
                    <option value="requested">Diminta (requested)</option>
                    <option value="hunting">Dicari (hunting)</option>
                    <option value="found">Ditemukan (found)</option>
                    <option value="purchased">Dibelanjakan (purchased)</option>
                    <option value="warehouse">Di Gudang (warehouse)</option>
                    <option value="shipped">Dikirim (shipped)</option>
                    <option value="out_of_stock">Habis (out_of_stock)</option>
                    <option value="cancelled">Dibatalkan (cancelled)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center gap-1.5 pt-4 pl-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Boleh Substitusi Varian
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-xs select-none">
                    <input
                      type="checkbox"
                      checked={itemSubOk}
                      onChange={(e) => setItemSubOk(e.target.checked)}
                      className="w-4.5 h-4.5 accent-orange-600"
                    />
                    Ya, boleh substitusi
                  </label>
                </div>
              </div>

              {/* Upload Proof */}
              <div className="flex flex-col gap-1 border border-dashed border-neutral-200 dark:border-zinc-800 p-4 rounded-2xl bg-neutral-50/30">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Foto Bukti Belanja (Vercel Blob)
                </label>
                <div className="flex items-center gap-3.5 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="proof-file-input"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="proof-file-input"
                    className="px-4 py-2 border border-neutral-300 dark:border-zinc-700 hover:border-neutral-500 rounded-xl text-xs font-extrabold cursor-pointer select-none transition-all disabled:opacity-50"
                  >
                    {uploading ? "Mengunggah..." : "Pilih Foto"}
                  </label>

                  {itemProofUrl && (
                    <div className="relative w-10 h-10 border rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemProofUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setItemProofUrl("")}
                        className="absolute inset-0 bg-black/50 hover:bg-black/75 flex items-center justify-center text-white text-[9px] font-black"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Atau masukkan URL gambar..."
                  value={itemProofUrl}
                  onChange={(e) => setItemProofUrl(e.target.value)}
                  className="px-3 py-1.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-[10px] font-mono mt-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Catatan untuk Item Ini
                </label>
                <input
                  type="text"
                  placeholder="Catatan khusus belanja..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingItem || uploading}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  {submittingItem ? "Menyimpan..." : "Simpan Item"}
                </button>

                {editingItem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editingItem.id)}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-xs font-black uppercase tracking-wider border border-red-200 transition cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-xs font-bold text-neutral-450 dark:text-zinc-500">Loading order...</div>
      </div>
    }>
      <OrderDetailsContent />
    </Suspense>
  );
}
