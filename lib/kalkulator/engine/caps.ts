import { FeeBreakdownItem } from './types';

/**
 * Helper untuk menghitung fee per-qty dan menerapkan capping
 */
export function calculateCappedFee(
  key: string,
  label: string,
  nettoPerUnit: number,
  ratePct: number,
  capPerUnit: number | null,
  qty: number
): FeeBreakdownItem {
  const rateDecimal = ratePct / 100;
  const uncappedFeePerUnit = nettoPerUnit * rateDecimal;

  let feePerUnit = uncappedFeePerUnit;
  let capped = false;

  if (capPerUnit !== null && uncappedFeePerUnit > capPerUnit) {
    feePerUnit = capPerUnit;
    capped = true;
  }

  const totalFee = Math.round(feePerUnit * qty);
  const totalNetto = nettoPerUnit * qty;
  const effectivePct = totalNetto > 0 ? (totalFee / totalNetto) * 100 : 0;

  return {
    key,
    label,
    ratePct,
    amount: totalFee,
    capped,
    effectivePct: Number(effectivePct.toFixed(2))
  };
}
