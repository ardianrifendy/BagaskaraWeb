export interface Product {
  id: string;              // slug, ex: "redmi-note-13-pro"
  brand: string;           // "Xiaomi"
  name: string;            // "Redmi Note 13 Pro"
  condition: "baru" | "second" | "like-new";
  specSummary: string;     // "8/256 · Snapdragon 7s Gen 2 · 5000mAh"
  specs: SpecGroup[];      // spesifikasi lengkap (accordion)
  highlights: SpecHighlight[]; // 4–6 icon card: chipset, RAM, kamera, baterai, layar, NFC
  variants: Variant[];
  warranty?: string;       // "Garansi toko 1 bulan"
  completeness?: string;   // "Fullset" | "Batangan"
  defects?: string[];      // minus untuk barang second
  createdAt: string;       // untuk sort "terbaru" & section "Baru Masuk"
  isScraped?: number;      // 0 for local store, 1 for Erafone PO reference
}

export interface Variant {
  id: string;
  productId?: string;      // Optional field to map back to product when queried individually
  color: string;           // "Midnight Black"
  colorHex: string;        // "#1a1a2e" — untuk swatch
  storage: string;         // "8/256"
  price: number;
  strikePrice?: number;    // hargaCoret (Fase 2)
  stock: "ready" | "habis";
  images: string[];        // foto per varian
}

export interface SpecHighlight {
  icon: string;
  label: string;
  value: string;
}

export interface SpecGroup {
  group: string;
  items: {
    label: string;
    value: string;
  }[];
}
