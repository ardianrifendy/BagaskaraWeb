import {
  TokopediaInput,
  TokopediaProfile,
  TokopediaCalcResult,
  TokopediaFeeItem
} from './types';
import tarifBaruData from '../../data/tarif/tokopedia-2026-05-18.json';
import tarifLamaData from '../../data/tarif/tokopedia-2025-06-10.json';

export function getCategoryBySlug(slug: string, useTarifLama = false) {
  const data = useTarifLama ? tarifLamaData : tarifBaruData;
  return data.kategori.find((k) => k.slug === slug) || data.kategori[0];
}

export function computeTokopediaFees(
  input: TokopediaInput,
  profile: TokopediaProfile,
  hargaJualUnit: number
): TokopediaCalcResult {
  const dataset = profile.useTarifLama ? tarifLamaData : tarifBaruData;
  const CAP = dataset.capKomisiPerItem;
  const handlingFeeUnit = dataset.orderHandlingFee;

  const qty = Math.max(1, input.qty);
  const grossPrice = hargaJualUnit * qty;
  const discountTotal = input.sellerDiscount * qty;
  let netPriceTotal = grossPrice - discountTotal;
  if (netPriceTotal < 0) netPriceTotal = 0;

  const hargaNettoUnit = netPriceTotal / qty;

  const category = getCategoryBySlug(input.categorySlug, profile.useTarifLama) as any;
  const rateDinamis = category.rateDinamis;

  // Dapatkan tarif platform berdasarkan jenis toko (Marketplace vs Mall)
  const defaultRateForStore = profile.storeType === 'mall'
    ? (category.ratePlatformMall ?? category.ratePlatformDefault ?? 0)
    : (category.ratePlatformMarketplace ?? category.ratePlatformDefault ?? 0);

  const ratePlatform = input.manualPlatformRate ?? defaultRateForStore;

  const items: TokopediaFeeItem[] = [];

  // 1. Komisi Platform (per item, per unit, baru kali QTY)
  if (ratePlatform > 0) {
    const rawPlatformPerUnit = hargaNettoUnit * (ratePlatform / 100);
    const cappedPlatformPerUnit = Math.min(rawPlatformPerUnit, CAP);
    const amountPlatform = Math.round(cappedPlatformPerUnit * qty);
    const isCapped = rawPlatformPerUnit > CAP;
    const effectivePct = hargaNettoUnit > 0 ? (cappedPlatformPerUnit / hargaNettoUnit) * 100 : ratePlatform;

    items.push({
      key: 'komisi_platform',
      label: `Komisi Platform (${ratePlatform.toString().replace('.', ',')}%)`,
      ratePct: ratePlatform,
      amount: amountPlatform,
      capped: isCapped,
      effectivePct: Number(effectivePct.toFixed(2))
    });
  }

  // 2. Komisi Dinamis (per item, per unit, baru kali QTY)
  const rawDinamisPerUnit = hargaNettoUnit * (rateDinamis / 100);
  const cappedDinamisPerUnit = Math.min(rawDinamisPerUnit, CAP);
  const amountDinamis = Math.round(cappedDinamisPerUnit * qty);
  const isDinamisCapped = rawDinamisPerUnit > CAP;
  const effectiveDinamisPct = hargaNettoUnit > 0 ? (cappedDinamisPerUnit / hargaNettoUnit) * 100 : rateDinamis;

  items.push({
    key: 'komisi_dinamis',
    label: `Komisi Dinamis (${rateDinamis.toString().replace('.', ',')}%)`,
    ratePct: rateDinamis,
    amount: amountDinamis,
    capped: isDinamisCapped,
    effectivePct: Number(effectiveDinamisPct.toFixed(2))
  });

  // 3. Komisi Affiliate TikTok (opsional)
  if (input.affiliateRate && input.affiliateRate > 0) {
    const amountAffiliate = Math.round(netPriceTotal * (input.affiliateRate / 100));
    items.push({
      key: 'komisi_affiliate',
      label: `Komisi Affiliate (${input.affiliateRate}%)`,
      ratePct: input.affiliateRate,
      amount: amountAffiliate,
      capped: false,
      effectivePct: input.affiliateRate
    });
  }

  // 4. Diskon GMV Max (opsional, mengurangi komisi platform)
  let diskonGmvMaxAmount = 0;
  if (input.gmvMaxDiscountRate && input.gmvMaxDiscountRate > 0) {
    const platformItem = items.find((i) => i.key === 'komisi_platform');
    const basePlatformAmount = platformItem ? platformItem.amount : 0;
    diskonGmvMaxAmount = Math.round(basePlatformAmount * (input.gmvMaxDiscountRate / 100));
    if (diskonGmvMaxAmount > 0) {
      items.push({
        key: 'diskon_gmv_max',
        label: `Diskon GMV Max (-${input.gmvMaxDiscountRate}%)`,
        ratePct: input.gmvMaxDiscountRate,
        amount: -diskonGmvMaxAmount,
        capped: false,
        effectivePct: input.gmvMaxDiscountRate
      });
    }
  }

  // 5. Order Handling Fee (Flat Rp 1.250 / order berhasil)
  const handlingTotal = (input.orderHandlingFee ?? handlingFeeUnit) * qty;
  if (handlingTotal > 0) {
    items.push({
      key: 'order_handling',
      label: `Order Handling Fee (Rp1.250/order)`,
      ratePct: null,
      amount: handlingTotal,
      capped: false,
      effectivePct: 0
    });
  }

  // 6. Biaya Layanan Logistik Variabel (per order / berat paket)
  const logistikTotal = (input.logisticCost ?? 0) * qty;
  if (logistikTotal > 0) {
    items.push({
      key: 'biaya_logistik',
      label: `Biaya Layanan Logistik Variabel`,
      ratePct: null,
      amount: logistikTotal,
      capped: false,
      effectivePct: 0
    });
  }

  // 7. Biaya Risiko (Order bermasalah/retur/pengiriman gagal)
  if (input.riskyOrderPct && input.riskyOrderPct > 0) {
    const amountRisiko = Math.round(10000 * (input.riskyOrderPct / 100) * qty);
    if (amountRisiko > 0) {
      items.push({
        key: 'biaya_risiko',
        label: `Estimasi Risiko Order (${input.riskyOrderPct}%)`,
        ratePct: input.riskyOrderPct,
        amount: amountRisiko,
        capped: false,
        effectivePct: 0
      });
    }
  }

  // Total Potongan
  const totalFees = items.reduce((sum, item) => sum + item.amount, 0);
  const totalFeesPct = netPriceTotal > 0 ? (totalFees / netPriceTotal) * 100 : 0;

  // Net Diterima
  const netReceived = netPriceTotal - totalFees;

  // Profit
  const costTotal = input.cost * qty;
  const profit = netReceived - costTotal;
  const marginPct = grossPrice > 0 ? (profit / grossPrice) * 100 : 0;

  return {
    grossPrice,
    netPrice: netPriceTotal,
    items,
    totalFees,
    totalFeesPct: Number(totalFeesPct.toFixed(2)),
    netReceived,
    profit,
    marginPct: Number(marginPct.toFixed(2))
  };
}
