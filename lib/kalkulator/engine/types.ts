export type SellerType = 'regular' | 'mall';
export type ProductSize = 'biasa' | 'khusus';
export type PromoProgram = 'none' | 'xtra' | 'xtra_plus';

export interface StoreProfile {
  sellerType: SellerType;
  isNewStore: boolean;
  joinedGOX: boolean;
  goxAdDiscount: boolean;
  promoProgram: PromoProgram;
  joinedInsurance: boolean;
  spaylaterMode: 'off' | 'worst' | 'estimate';
  spaylaterPct: number;
  spaylaterTenor: 3 | 6;
  orderProcessingFee: number;
  packingCost: number;
  adCostPct: number;
}

export interface ProductInput {
  name: string;
  categoryKey: string;
  size: ProductSize;
  isPreOrder: boolean;
  insuranceCost: number;
  qty: number;
  cost: number;
  sellerDiscount: number;
}

export interface FeeBreakdownItem {
  key: string;
  label: string;
  ratePct: number | null;
  amount: number;
  capped: boolean;
  effectivePct: number;
}

export interface CalcResult {
  grossPrice: number;
  netPrice: number;
  items: FeeBreakdownItem[];
  totalFees: number;
  totalFeesPct: number;
  netReceived: number;
  profit: number;
  marginPct: number;
}
