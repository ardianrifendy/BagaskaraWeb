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
  logisticCost?: number; // Rp estimasi logistik
  riskyOrderPct?: number; // % estimasi order bermasalah
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
}
