/**
 * Calculations for Jastip Pricing.
 * Handles item pricing, conversion, fees, and proportional domestic/intl shipping fees.
 */

interface ItemPriceInput {
  price: number;            // Currency asal (foreign currency)
  exchangeRate: number;     // Kurs per batch
  feeType: "flat" | "percent" | string;
  feeValue: number;         // Flat fee per qty OR percent value (e.g. 10 for 10%)
  qty: number;
  weightGrams?: number;      // Berat item (opsional)
  totalWeightGrams?: number; // Total berat seluruh item di order (opsional)
  totalShippingIdr?: number; // Total ongkir domestik/internasional order (opsional)
}

interface ItemPriceBreakdown {
  basePriceIdr: number;      // (price * exchangeRate) * qty
  feeIdr: number;            // flat fee * qty ATAU basePriceIdr * (feeValue / 100)
  shippingIdr: number;       // ongkir proporsional
  finalPriceIdr: number;     // basePriceIdr + feeIdr + shippingIdr
}

/**
 * Calculates final price in IDR for a single item (taking qty into account).
 */
export function calculateItemPrice({
  price,
  exchangeRate,
  feeType,
  feeValue,
  qty,
  weightGrams = 0,
  totalWeightGrams = 0,
  totalShippingIdr = 0,
}: ItemPriceInput): ItemPriceBreakdown {
  const parsedPrice = Number(price) || 0;
  const parsedRate = Number(exchangeRate) || 0;
  const parsedFeeValue = Number(feeValue) || 0;
  const parsedQty = Number(qty) || 0;

  // Base price in IDR for all quantities
  const basePriceIdr = parsedPrice * parsedRate * parsedQty;

  // Fee calculation
  let feeIdr = 0;
  if (feeType === "percent") {
    // Percentage fee is calculated based on base price IDR
    feeIdr = basePriceIdr * (parsedFeeValue / 100);
  } else {
    // Flat fee is per unit qty
    feeIdr = parsedFeeValue * parsedQty;
  }

  // Proportional shipping cost
  let shippingIdr = 0;
  if (totalShippingIdr > 0 && totalWeightGrams > 0 && weightGrams > 0) {
    const itemTotalWeight = weightGrams * parsedQty;
    shippingIdr = (itemTotalWeight / totalWeightGrams) * totalShippingIdr;
  }

  // Final Price
  const finalPriceIdr = basePriceIdr + feeIdr + shippingIdr;

  return {
    basePriceIdr: Math.round(basePriceIdr),
    feeIdr: Math.round(feeIdr),
    shippingIdr: Math.round(shippingIdr),
    finalPriceIdr: Math.round(finalPriceIdr),
  };
}
