import { ProductInput, StoreProfile, CalcResult, FeeBreakdownItem } from './types';
import { getAdminFeeRate, getGoxRate, getFlatFee } from '../data/fees';
import { calculateCappedFee } from './caps';

export function calculateFees(input: ProductInput, profile: StoreProfile, rawPrice: number): CalcResult {
  // 1. Dasar Perhitungan: HARGA NETTO (Harga Asli - Diskon)
  // netPrice adalah HARGA NETTO TOTAL, nettoPerUnit adalah HARGA NETTO PER BARANG
  const grossPrice = rawPrice * input.qty;
  const discountTotal = input.sellerDiscount * input.qty;
  let netPrice = grossPrice - discountTotal;

  // Edge Case: Jika diskon > harga, netto clamp ke 0
  if (netPrice < 0) netPrice = 0;
  const nettoPerUnit = netPrice / input.qty;

  const items: FeeBreakdownItem[] = [];

  // 1. Biaya Administrasi (Tanpa CAP, skip jika toko baru tipe regular)
  if (!(profile.sellerType === 'regular' && profile.isNewStore)) {
    const adminRate = getAdminFeeRate(input.categoryKey, profile.sellerType === 'mall');
    const adminFee = Math.round(netPrice * (adminRate / 100));
    items.push({
      key: 'admin',
      label: `Biaya Admin (${adminRate}%)`,
      ratePct: adminRate,
      amount: adminFee,
      capped: false,
      effectivePct: adminRate
    });
  }

  // 2. Biaya Pembayaran Mall (1.8%, CAP 50.000/qty)
  if (profile.sellerType === 'mall') {
    items.push(calculateCappedFee('payment_mall', 'Biaya Pembayaran (1,8%)', nettoPerUnit, 1.8, getFlatFee('mallPaymentCap'), input.qty));
  }

  // 3. GOX (Skip jika toko baru, punya cap per-ukuran)
  if (profile.joinedGOX && !profile.isNewStore) {
    let goxRate = getGoxRate(input.categoryKey, input.size);
    // Diskon pengguna iklan (max 1.5% efektifnya)
    if (profile.goxAdDiscount && goxRate > 1.5) goxRate = 1.5;

    const cap = input.size === 'biasa' ? getFlatFee('goxCapBiasa') : getFlatFee('goxCapKhusus');
    items.push(calculateCappedFee('gox', `GOX (${goxRate.toString().replace('.', ',')}%)`, nettoPerUnit, goxRate, cap, input.qty));
  }

  // 4. Promo XTRA (4.5%, CAP 60.000/qty)
  if (profile.promoProgram === 'xtra') {
    items.push(calculateCappedFee('promo_xtra', 'Promo XTRA (4,5%)', nettoPerUnit, 4.5, getFlatFee('promoXtraCap'), input.qty));
  }

  // 5. Promo XTRA+ (6.5%, CAP 80.000/qty)
  if (profile.promoProgram === 'xtra_plus') {
    items.push(calculateCappedFee('promo_xtra_plus', 'Promo XTRA+ (6,5%)', nettoPerUnit, 6.5, getFlatFee('promoXtraPlusCap'), input.qty));
  }

  // 6. Pre-Order (3%)
  if (input.isPreOrder) {
    const preOrderFee = Math.round(netPrice * 0.03);
    items.push({
      key: 'preorder',
      label: 'Biaya Pre-Order (3%)',
      ratePct: 3,
      amount: preOrderFee,
      capped: false,
      effectivePct: 3
    });
  }

  // 6.5. Program Asuransi Shopee (0.5% dari harga yang dipasang)
  if (profile.joinedInsurance) {
    const insuranceFee = Math.round(grossPrice * 0.005);
    items.push({
      key: 'shopee_insurance',
      label: 'Asuransi Shopee (0.5%)',
      ratePct: 0.5,
      amount: insuranceFee,
      capped: false,
      effectivePct: 0.5
    });
  }

  // 7. SPayLater Xtra (per pesanan)
  if (profile.spaylaterMode !== 'off') {
    const spaylaterRate = profile.spaylaterTenor === 6 ? 4.0 : 2.5;
    const factor = profile.spaylaterMode === 'worst' ? 1 : (profile.spaylaterPct / 100);
    const spaylaterFee = Math.round(netPrice * (spaylaterRate / 100) * factor);

    items.push({
      key: 'spaylater',
      label: `SPayLater Xtra (${spaylaterRate}%${profile.spaylaterMode === 'estimate' ? ' - est' : ''})`,
      ratePct: spaylaterRate,
      amount: spaylaterFee,
      capped: false,
      effectivePct: netPrice > 0 ? Number(((spaylaterFee/netPrice)*100).toFixed(2)) : 0
    });
  }

  // 8. Biaya Proses Pesanan (Flat per pesanan, skip jika isNewStore)
  if (!profile.isNewStore) {
    items.push({
      key: 'process',
      label: 'Biaya Proses Pesanan',
      ratePct: null,
      amount: profile.orderProcessingFee,
      capped: false,
      effectivePct: 0
    });
  }

  // Jumlahkan semua biaya Shopee
  const totalFees = items.reduce((sum, item) => sum + item.amount, 0);
  const totalFeesPct = netPrice > 0 ? (totalFees / netPrice) * 100 : 0;

  // Net diterima (Saldo Penjual)
  const netReceived = netPrice - totalFees;

  // Biaya tambahan seller (di luar Shopee)
  const costTotal = input.cost * input.qty;
  const adsCost = Math.round(netPrice * (profile.adCostPct / 100));

  if (profile.packingCost > 0) {
    items.push({ key: 'packing', label: 'Packing (Eksternal)', ratePct: null, amount: profile.packingCost, capped: false, effectivePct: 0 });
  }
  if (adsCost > 0) {
    items.push({ key: 'ads', label: `Iklan (${profile.adCostPct}%)`, ratePct: profile.adCostPct, amount: adsCost, capped: false, effectivePct: profile.adCostPct });
  }
  if (input.insuranceCost > 0) {
    items.push({ key: 'insurance', label: 'Asuransi (Eksternal)', ratePct: null, amount: input.insuranceCost, capped: false, effectivePct: 0 });
  }

  const externalCosts = profile.packingCost + adsCost + input.insuranceCost;

  // PROFIT AKHIR
  const profit = netReceived - costTotal - externalCosts;
  const marginPct = grossPrice > 0 ? (profit / grossPrice) * 100 : 0;

  return {
    grossPrice,
    netPrice,
    items,
    totalFees,
    totalFeesPct: Number(totalFeesPct.toFixed(2)),
    netReceived,
    profit,
    marginPct: Number(marginPct.toFixed(2))
  };
}
