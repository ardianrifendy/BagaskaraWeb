export type StoreType = 'marketplace' | 'mall';

export interface TokopediaCategory {
  slug: string;
  nama: string;
  rateDinamis: number;
  rateDinamisLama: number;
  ratePlatformDefault?: number | null;
  ratePlatformMarketplace?: number;
  ratePlatformMall?: number;
}

export interface TokopediaInput {
  categorySlug: string;
  cost: number;
  qty: number;
  sellerDiscount: number;
  // Opsi lanjutan per produk / per transaksi
  manualPlatformRate?: number | null; // % komisi platform (jika null, gunakan default/input user)
  affiliateRate?: number; // % komisi affiliate (TikTok)
  gmvMaxDiscountRate?: number; // % diskon GMV Max
  orderHandlingFee?: number; // Rp 1.250
  logisticCost?: number; // Rp estimasi logistik (override manual)
  riskyOrderPct?: number; // % estimasi order bermasalah
  
  // Parameter Logistik Otomatis (BLL)
  logisticServiceType?: 'standar' | 'ekonomi' | 'kargo' | 'instan' | null;
  logisticRoute?: string | null;
  logisticOrigin?: string | null;
  weightGram?: number | null;
  dimensions?: { p: number; l: number; t: number } | null;
}

export interface TokopediaProfile {
  storeType: StoreType;
  useTarifLama?: boolean;
}

export interface TokopediaFeeItem {
  key: string;
  label: string;
  ratePct: number | null;
  amount: number;
  capped: boolean;
  effectivePct: number;
}

export interface TokopediaCalcResult {
  grossPrice: number;
  netPrice: number;
  items: TokopediaFeeItem[];
  totalFees: number;
  totalFeesPct: number;
  netReceived: number;
  profit: number;
  marginPct: number;
  
  // Status Logistik
  isLogisticUnavailable?: boolean;
  logisticUnavailableReason?: string;
  totalBillableWeight?: number; // dalam kg
}

