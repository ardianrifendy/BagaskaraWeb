"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  checkPin, 
  getOwnerProducts, 
  getVariantsForProduct, 
  saveProduct, 
  deleteProduct, 
  saveVariant, 
  deleteVariant 
} from "./actions";

interface ProductItem {
  id: string;
  brand: string;
  name: string;
  condition: string;
  specSummary: string;
  specs: string;
  highlights: string;
  warranty: string;
  completeness: string;
  defects: string;
  createdAt: string;
  variantCount: number;
}

interface VariantItem {
  id: string;
  productId: string;
  color: string;
  colorHex: string;
  storage: string;
  price: number;
  strikePrice: number | null;
  stock: "ready" | "habis";
  images: string;
}

export default function StokManagerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  
  // Data States
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modals / Form States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  
  const [productForm, setProductForm] = useState({
    id: "",
    brand: "",
    name: "",
    condition: "baru",
    completeness: "Fullset",
    warranty: "Garansi Resmi",
    defects: "" // Comma separated string for form
  });

  const [variantForm, setVariantForm] = useState({
    id: "",
    color: "",
    colorHex: "#1a1a2e",
    storage: "",
    price: "",
    stock: "ready" as "ready" | "habis",
    images: ""
  });

  // Auth checking
  useEffect(() => {
    const auth = localStorage.getItem("bagaskara_stok_auth");
    if (auth === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch products
  const fetchProducts = (query = "") => {
    startTransition(async () => {
      const data = await getOwnerProducts(query);
      setProducts(data);
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts(searchQuery);
    }
  }, [isAuthenticated, searchQuery]);

  // Fetch variants when product is expanded
  const handleToggleProduct = async (productId: string) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      setVariants([]);
    } else {
      setSelectedProductId(productId);
      const varData = await getVariantsForProduct(productId);
      setVariants(varData);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    const isOk = await checkPin(pin);
    if (isOk) {
      localStorage.setItem("bagaskara_stok_auth", "true");
      setIsAuthenticated(true);
    } else {
      setPinError("PIN Toko salah! Coba lagi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bagaskara_stok_auth");
    setIsAuthenticated(false);
    setPin("");
  };

  // Product Save/Delete
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.brand || !productForm.name) return;

    const defectsArray = productForm.defects
      ? productForm.defects.split(",").map(d => d.trim()).filter(Boolean)
      : [];

    const res = await saveProduct({
      id: productForm.id || undefined,
      brand: productForm.brand,
      name: productForm.name,
      condition: productForm.condition,
      completeness: productForm.completeness,
      warranty: productForm.warranty,
      defects: defectsArray
    });

    if (res.success) {
      setShowProductModal(false);
      fetchProducts(searchQuery);
      setProductForm({ id: "", brand: "", name: "", condition: "baru", completeness: "Fullset", warranty: "Garansi Resmi", defects: "" });
      if (res.productId) {
        setSelectedProductId(res.productId);
        const varData = await getVariantsForProduct(res.productId);
        setVariants(varData);
      }
    } else {
      alert(res.error || "Gagal menyimpan produk.");
    }
  };

  const handleEditProduct = (prod: ProductItem) => {
    let parsedDefects: string[] = [];
    try {
      parsedDefects = JSON.parse(prod.defects);
    } catch {
      parsedDefects = [];
    }

    setProductForm({
      id: prod.id,
      brand: prod.brand,
      name: prod.name,
      condition: prod.condition,
      completeness: prod.completeness || "Fullset",
      warranty: prod.warranty || "Garansi Resmi",
      defects: parsedDefects.join(", ")
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${name}" dan seluruh variannya dari database?`)) {
      const res = await deleteProduct(id);
      if (res.success) {
        if (selectedProductId === id) setSelectedProductId(null);
        fetchProducts(searchQuery);
      } else {
        alert(res.error || "Gagal menghapus produk");
      }
    }
  };

  // Variant Save/Delete/Toggle
  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !variantForm.color || !variantForm.storage || !variantForm.price) return;

    const imagesArray = variantForm.images
      ? variantForm.images.split(",").map(img => img.trim()).filter(Boolean)
      : [];

    const res = await saveVariant({
      id: variantForm.id || undefined,
      productId: selectedProductId,
      color: variantForm.color,
      colorHex: variantForm.colorHex,
      storage: variantForm.storage,
      price: parseInt(variantForm.price) || 0,
      stock: variantForm.stock,
      images: imagesArray
    });

    if (res.success) {
      setShowVariantModal(false);
      const varData = await getVariantsForProduct(selectedProductId);
      setVariants(varData);
      fetchProducts(searchQuery);
      setVariantForm({ id: "", color: "", colorHex: "#1a1a2e", storage: "", price: "", stock: "ready", images: "" });
    } else {
      alert(res.error || "Gagal menyimpan varian");
    }
  };

  const handleEditVariant = (v: VariantItem) => {
    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(v.images);
    } catch {
      parsedImages = [];
    }

    setVariantForm({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex || "#8e8e93",
      storage: v.storage,
      price: v.price.toString(),
      stock: v.stock,
      images: parsedImages.join(", ")
    });
    setShowVariantModal(true);
  };

  const handleDeleteVariant = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus varian ini?")) {
      const res = await deleteVariant(id, selectedProductId!);
      if (res.success) {
        const varData = await getVariantsForProduct(selectedProductId!);
        setVariants(varData);
        fetchProducts(searchQuery);
      }
    }
  };

  const handleToggleStock = async (v: VariantItem) => {
    const nextStock = v.stock === "ready" ? "habis" : "ready";
    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(v.images);
    } catch {
      parsedImages = [];
    }

    const res = await saveVariant({
      id: v.id,
      productId: v.productId,
      color: v.color,
      colorHex: v.colorHex,
      storage: v.storage,
      price: v.price,
      stock: nextStock,
      images: parsedImages
    });
    if (res.success) {
      const varData = await getVariantsForProduct(selectedProductId!);
      setVariants(varData);
      fetchProducts(searchQuery);
    }
  };

  const formatRupiah = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  // Wait for loading auth state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center">
        <span className="text-neutral-400 font-semibold animate-pulse">Loading auth status...</span>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-xl flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl font-black text-orange-600">Bagaskara Cell</span>
            <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">Akses Kontrol Stok</span>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">PIN Akses Toko</label>
              <input
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-orange-500 dark:text-white"
                required
              />
              {pinError && <span className="text-[10px] text-red-500 font-bold mt-1">{pinError}</span>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Masuk ke Dashboard
            </button>
          </form>
          
          <span className="text-[10px] text-neutral-400">Gunakan PIN default toko Anda.</span>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 flex flex-col pb-12 transition-colors duration-200">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 border-b border-neutral-200 dark:border-zinc-800/80 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-black text-orange-600 leading-none">Bagaskara Cell</span>
            <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-black">Manajer Stok Fisik</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setProductForm({ id: "", brand: "", name: "", condition: "baru", completeness: "Fullset", warranty: "Garansi Resmi", defects: "" });
                setShowProductModal(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              HP Baru
            </button>
            
            <button
              onClick={handleLogout}
              className="text-neutral-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 text-xs font-black transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full px-4 mt-6 flex flex-col gap-6">
        
        {/* Search Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col gap-3">
          <label className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Cari Produk Stok Toko</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Masukkan kata kunci nama HP (contoh: Redmi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-orange-500 dark:text-white"
            />
            <svg className="w-4.5 h-4.5 text-neutral-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Loading Indicator */}
        {isPending && (
          <div className="text-center py-4">
            <span className="text-xs text-neutral-400 animate-pulse font-bold">Menghubungkan ke database...</span>
          </div>
        )}

        {/* Products List Grid */}
        <div className="flex flex-col gap-4">
          {products.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col gap-2">
              <span className="text-sm font-bold text-neutral-500 dark:text-zinc-400">Tidak ada produk ditemukan</span>
              <span className="text-xs text-neutral-400 dark:text-zinc-500">Gunakan kata kunci pencarian lain atau tambahkan produk baru.</span>
            </div>
          ) : (
            products.map((p) => {
              const isExpanded = selectedProductId === p.id;
              let defectsList: string[] = [];
              try {
                defectsList = JSON.parse(p.defects);
              } catch {
                defectsList = [];
              }
              
              return (
                <div 
                  key={p.id} 
                  className={`bg-white dark:bg-zinc-900 border rounded-3xl transition-all shadow-sm overflow-hidden ${
                    isExpanded 
                      ? "border-orange-500/40 ring-4 ring-orange-500/5" 
                      : "border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Card Header Info */}
                  <div 
                    onClick={() => handleToggleProduct(p.id)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex flex-col gap-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-neutral-100 dark:bg-zinc-800/80 text-[10px] font-black uppercase px-2 py-0.5 rounded text-neutral-500 dark:text-zinc-400">
                          {p.brand}
                        </span>
                        <span className="bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          {p.condition}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-neutral-800 dark:text-zinc-150 leading-tight">
                        {p.name}
                      </h3>
                      <div className="flex gap-x-3 gap-y-1 flex-wrap text-[10px] text-neutral-400 font-semibold">
                        <span>📦 {p.completeness}</span>
                        <span>🛡️ {p.warranty}</span>
                        {defectsList.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ {defectsList.length} Minus</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-neutral-700 dark:text-zinc-300">
                          {p.variantCount} Varian
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {isExpanded ? "Tutup" : "Kelola"}
                        </span>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Variants Section */}
                  {isExpanded && (
                    <div className="bg-neutral-50/50 dark:bg-zinc-950/40 border-t border-neutral-100 dark:border-zinc-800/80 p-5 flex flex-col gap-4">
                      
                      {/* Product Actions */}
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-zinc-800/60">
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-black uppercase tracking-wider">Kelola Stok & Varian</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 text-2xs font-extrabold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit HP
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-2xs font-extrabold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Hapus HP
                          </button>
                        </div>
                      </div>

                      {/* Variants Grid */}
                      <div className="flex flex-col gap-2.5">
                        {variants.length === 0 ? (
                          <div className="text-center py-6">
                            <span className="text-xs text-neutral-400 font-semibold">{"HP ini belum memiliki varian. Klik \"Tambah Varian\" untuk memulai."}</span>
                          </div>
                        ) : (
                          variants.map((v) => {
                            const isReady = v.stock === "ready";
                            return (
                              <div 
                                key={v.id} 
                                className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/60 p-3.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-5 h-5 rounded-full border border-neutral-200 dark:border-zinc-700 flex-shrink-0 shadow-2xs" 
                                    style={{ backgroundColor: v.colorHex }}
                                    title={v.color}
                                  />
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                                      {v.color} ({v.storage})
                                    </span>
                                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 mt-0.5">
                                      {formatRupiah(v.price)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Quick Stock Toggle (TAP TO UPDATE) */}
                                  <button
                                    onClick={() => handleToggleStock(v)}
                                    className={`px-3 py-1.5 rounded-lg text-2xs font-black uppercase tracking-wide cursor-pointer transition-colors shadow-2xs ${
                                      isReady 
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100" 
                                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-100"
                                    }`}
                                  >
                                    {isReady ? "🟢 Ready" : "🔴 Habis"}
                                  </button>

                                  {/* Actions */}
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleEditVariant(v)}
                                      className="p-1.5 text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      title="Edit Varian"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVariant(v.id)}
                                      className="p-1.5 text-neutral-400 dark:text-zinc-500 hover:text-red-500 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      title="Hapus Varian"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add Variant Button */}
                      <button
                        onClick={() => {
                          setVariantForm({ id: "", color: "", colorHex: "#1a1a2e", storage: "", price: "", stock: "ready", images: "" });
                          setShowVariantModal(true);
                        }}
                        className="w-full border border-dashed border-neutral-300 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 text-neutral-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-black py-2.5 rounded-xl transition-all cursor-pointer bg-white dark:bg-zinc-900"
                      >
                        + Tambah Varian (Warna & Kapasitas)
                      </button>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* PRODUCT FORM MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-black text-neutral-800 dark:text-zinc-100">
                {productForm.id ? "Edit Detail HP" : "Tambah HP Baru ke Stok"}
              </h2>
              <button 
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Merek (Brand)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Apple, Xiaomi"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Kondisi Unit</label>
                  <select
                    value={productForm.condition}
                    onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-zinc-300 font-bold"
                  >
                    <option value="baru">Baru</option>
                    <option value="second">Second</option>
                    <option value="like-new">Like New</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Nama Seri HP</label>
                <input
                  type="text"
                  placeholder="Contoh: iPhone 11 Pro Max"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Kelengkapan Paket</label>
                  <input
                    type="text"
                    placeholder="Contoh: Fullset, Batangan"
                    value={productForm.completeness}
                    onChange={(e) => setProductForm({ ...productForm, completeness: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Garansi Unit</label>
                  <input
                    type="text"
                    placeholder="Contoh: Garansi Resmi 1 Tahun"
                    value={productForm.warranty}
                    onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Catatan Minus/Defect (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Contoh: Ada lecet di pojok bawah, Face ID mati"
                  value={productForm.defects}
                  onChange={(e) => setProductForm({ ...productForm, defects: e.target.value })}
                  className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition-colors cursor-pointer mt-2"
              >
                {productForm.id ? "Simpan Perubahan HP" : "Tambah HP ke Database"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VARIANT FORM MODAL */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-black text-neutral-800 dark:text-zinc-100">
                {variantForm.id ? "Edit Detail Varian" : "Tambah Varian Baru"}
              </h2>
              <button 
                onClick={() => setShowVariantModal(false)}
                className="text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Warna (Nama)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Midnight Black"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Warna (Pilihan Kode Warna)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={variantForm.colorHex}
                      onChange={(e) => setVariantForm({ ...variantForm, colorHex: e.target.value })}
                      className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={variantForm.colorHex}
                      onChange={(e) => setVariantForm({ ...variantForm, colorHex: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Kapasitas (Storage)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 8GB/256GB"
                    value={variantForm.storage}
                    onChange={(e) => setVariantForm({ ...variantForm, storage: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Harga Unit (Rupiah)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 3200000"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">Status Stok Awal</label>
                <select
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value as "ready" | "habis" })}
                  className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-zinc-300 font-bold"
                >
                  <option value="ready">Ready (Ada Stok)</option>
                  <option value="habis">Habis (Kosong)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">URL / Path Gambar (Pisahkan dengan koma jika banyak)</label>
                <input
                  type="text"
                  placeholder="Contoh: /images/nama_file.jpg atau link internet"
                  value={variantForm.images}
                  onChange={(e) => setVariantForm({ ...variantForm, images: e.target.value })}
                  className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 dark:text-white font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition-colors cursor-pointer mt-2"
              >
                {variantForm.id ? "Simpan Perubahan Varian" : "Tambah Varian ke HP"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
