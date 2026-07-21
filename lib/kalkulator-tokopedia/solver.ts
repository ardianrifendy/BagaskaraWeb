import {
  TokopediaInput,
  TokopediaProfile,
  TokopediaCalcResult
} from './types';
import { computeTokopediaFees } from './fees';

export interface ReverseInput extends TokopediaInput {
  targetProfit: number;
}

export interface SolverReverseResult {
  rawPrice: number;
  suggestedPrice: number;
  breakdown: TokopediaCalcResult;
}

export function roundPsychological(price: number): number {
  if (price <= 0) return 0;
  if (price < 10000) return Math.ceil(price / 100) * 100;
  if (price < 100000) return Math.ceil(price / 500) * 500 - 100; // cth: 49.900, 87.900
  if (price < 1000000) return Math.ceil(price / 1000) * 1000 - 100; // cth: 99.900, 249.900
  return Math.ceil(price / 1000) * 1000;
}

export function solveForward(
  input: TokopediaInput,
  profile: TokopediaProfile,
  hargaJualUnit: number
): TokopediaCalcResult {
  return computeTokopediaFees(input, profile, hargaJualUnit);
}

/**
 * Binary search solver untuk menentukan harga jual unit minimum demi mencapai targetProfit.
 * 60 iterasi, presisi sub-Rupiah (toleransi Rp1).
 */
export function solveReverse(
  input: ReverseInput,
  profile: TokopediaProfile
): SolverReverseResult {
  const qty = Math.max(1, input.qty);
  const totalCost = input.cost * qty;
  const targetProfitTotal = input.targetProfit * qty;

  // Batas bawah awal
  let lo = input.cost + input.sellerDiscount;
  if (lo < 0) lo = 0;

  // Batas atas awal (asumsi potongan maksimal platform 50%)
  let hi = (totalCost + targetProfitTotal) / qty * 2 + input.sellerDiscount + 100000;
  if (hi < lo) hi = lo + 1000000;

  let bestPrice = hi;
  let bestBreakdown: TokopediaCalcResult | null = null;

  for (let i = 0; i < 60; i++) {
    const mid = lo + (hi - lo) / 2;
    const res = computeTokopediaFees(input, profile, mid);

    if (res.profit >= targetProfitTotal) {
      bestPrice = mid;
      bestBreakdown = res;
      hi = mid;
    } else {
      lo = mid;
    }

    if (hi - lo < 0.01) break;
  }

  if (!bestBreakdown) {
    bestBreakdown = computeTokopediaFees(input, profile, hi);
    bestPrice = hi;
  }

  const rawPriceInt = Math.ceil(bestPrice);
  const suggestedPrice = roundPsychological(rawPriceInt);

  // Hitung ulang breakdown dengan suggestedPrice
  const finalBreakdown = computeTokopediaFees(input, profile, suggestedPrice);

  return {
    rawPrice: rawPriceInt,
    suggestedPrice,
    breakdown: finalBreakdown
  };
}
