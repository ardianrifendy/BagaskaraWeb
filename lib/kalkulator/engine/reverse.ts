import { ProductInput, StoreProfile, CalcResult } from './types';
import { calculateFees } from './calc';
import { roundPsychological } from './rounding';

export type ReverseInput = Omit<ProductInput, 'cost'> & { cost: number; targetProfit: number };

export interface ReverseResult {
  rawPrice: number;
  suggestedPrice: number;
  breakdown: CalcResult;
}

/**
 * Mencari harga jual minimum untuk mencapai target profit.
 * Wajib menggunakan Binary Search (60 iterasi) karena aturan CAP membuat fungsi profit non-linear (piecewise).
 */
export function findMinimumPrice(input: ReverseInput, profile: StoreProfile): ReverseResult {
  const targetProfit = input.targetProfit;

  // Total biaya eksternal flat
  const flatExternalCost = profile.packingCost + input.insuranceCost + (input.cost * input.qty);
  // Total biaya shopee flat
  const flatShopeeCost = profile.isNewStore ? 0 : profile.orderProcessingFee;

  // Tebakan awal batas bawah (batas absolut terkecil di mana profit target mungkin tercapai jika fee 0%)
  // Harga Jual (Gross) minimum per unit
  const minimumAbsolutePricePerUnit = (flatExternalCost + flatShopeeCost + targetProfit) / input.qty + input.sellerDiscount;
  let lo = minimumAbsolutePricePerUnit;

  // Batas atas (Anggap potongan Shopee ekstrem 50% dari harga netto)
  let hi = minimumAbsolutePricePerUnit / (1 - 0.50);

  // Jika lo < 0 karena entah kenapa cost/profit negatif (misal sample gratis), pastikan minimal 0
  if (lo < 0) lo = 0;
  if (hi < lo) hi = lo + 1000000; // safety

  let bestRawPrice = hi; // Default aman ke yang paling mahal
  let bestBreakdown: CalcResult | null = null;

  // Binary search (maks 60 iterasi untuk presisi sub-Rupiah)
  for (let i = 0; i < 60; i++) {
    const mid = lo + (hi - lo) / 2;

    // Uji harga 'mid' (rawPrice per unit)
    const testInput: ProductInput = { ...input, cost: input.cost }; // convert ReverseInput back to ProductInput
    const res = calculateFees(testInput, profile, mid);

    // Kita mencari di mana res.profit >= targetProfit
    if (res.profit >= targetProfit) {
      bestRawPrice = mid;
      bestBreakdown = res;
      hi = mid; // coba turunkan lagi apakah masih untung
    } else {
      lo = mid; // rugi, harga harus lebih tinggi
    }

    // Jika batas atas dan bawah sudah sangat berdekatan (kurang dari Rp 0.01)
    if (hi - lo < 0.01) break;
  }

  // Jika tidak ditemukan solusi sama sekali (kasus ekstrim)
  if (!bestBreakdown) {
    const testInput: ProductInput = { ...input, cost: input.cost };
    bestBreakdown = calculateFees(testInput, profile, hi);
    bestRawPrice = hi;
  }

  // Bulatkan psikologis
  const rawPriceInt = Math.ceil(bestRawPrice);
  const suggestedPrice = roundPsychological(rawPriceInt);

  // Jika suggestedPrice dihitung ulang breakdownnya, pasti akan profitnya melampaui target
  const finalInput: ProductInput = { ...input, cost: input.cost };
  const finalBreakdown = calculateFees(finalInput, profile, suggestedPrice);

  return {
    rawPrice: rawPriceInt,
    suggestedPrice: suggestedPrice,
    breakdown: finalBreakdown
  };
}
