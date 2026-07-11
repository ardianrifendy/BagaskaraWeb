import feesData from '../shopee_fees_2026.json';
import { ProductSize } from '../engine/types';
import { CATEGORY_DICTIONARY } from '../detect/keywords';

// Ekstrak struktur dari JSON
const adminFeesRegular = feesData.admin_fees_regular;
const adminFeesMall = feesData.admin_fees_mall;
const goxRates = feesData.gox.rates_ukuran_biasa;

function isMatch(jsonItem: string, subKey: string): boolean {
  if (!jsonItem || !subKey) return false;
  const jsonWords = jsonItem.toLowerCase().replace(/[(),&/]/g, ' ').split(/\s+/).filter(Boolean);
  const subKeyWords = subKey.toLowerCase().split('_').filter(Boolean);

  if (subKeyWords.length === 1) {
    return jsonWords.includes(subKeyWords[0]);
  }

  return subKeyWords.every(word => jsonWords.includes(word));
}

/**
 * Mencari tarif biaya admin berdasarkan kategori (string key misal: 'elektronik.aksesoris_hp_casing')
 */
export function getAdminFeeRate(categoryKey: string, isMall: boolean): number {
  if (!categoryKey) return 0;

  // 1. Prioritaskan lookup dari CATEGORY_DICTIONARY agar sinkron dengan yang tampil di UI
  const dictionaryEntry = CATEGORY_DICTIONARY.find(item => item.key === categoryKey);
  if (dictionaryEntry) {
    return isMall ? dictionaryEntry.adminPct.mall : dictionaryEntry.adminPct.regular;
  }

  // 2. Fallback ke pencarian JSON jika key tidak terdaftar di dictionary
  const [group, keywordStr] = categoryKey.split('.');
  const feeGroup = isMall ? adminFeesMall : adminFeesRegular;

  // Cast safety
  const groupData = (feeGroup as unknown as Record<string, Record<string, string[]>>)[group];
  if (!groupData) return isMall ? 7.2 : 6.5; // fallback aman rata-rata

  // Cari rate (misal "10.00") yang array-nya mengandung keywordStr
  for (const rateStr in groupData) {
    const items: string[] = groupData[rateStr];
    if (items.some(item => isMatch(item, keywordStr))) {
      return parseFloat(rateStr);
    }
  }

  // Default jika subkategori tak ditemukan di group itu
  return isMall ? 7.2 : 6.5;
}

/**
 * Mencari persentase Gratis Ongkir XTRA (GOX)
 */
export function getGoxRate(categoryKey: string, size: ProductSize): number {
  if (!categoryKey) return 0;

  // 1. Prioritaskan lookup dari CATEGORY_DICTIONARY
  const dictionaryEntry = CATEGORY_DICTIONARY.find(item => item.key === categoryKey);
  if (dictionaryEntry) {
    return size === 'biasa' ? dictionaryEntry.goxPct.biasa : dictionaryEntry.goxPct.khusus;
  }

  // 2. Fallback ke pencarian JSON
  const [group, keywordStr] = categoryKey.split('.');
  const groupData = (goxRates as unknown as Record<string, Record<string, string[]>>)[group];

  if (!groupData) return size === 'biasa' ? 5.5 : 7.0; // fallback rata-rata

  for (const rateStr in groupData) {
    const items: string[] = groupData[rateStr];
    if (items.some(item => isMatch(item, keywordStr))) {
      const baseRate = parseFloat(rateStr);
      if (size === 'biasa') return baseRate;

      // Map ke ukuran khusus jika size = 'khusus'
      const khususMapping = feesData.gox.tier_mapping_biasa_ke_khusus;
      return (khususMapping as Record<string, number>)[baseRate.toFixed(1)] || baseRate + 1.5;
    }
  }

  return size === 'biasa' ? 5.5 : 7.0;
}

export function getFlatFee(key: 'orderProcessing' | 'goxCapBiasa' | 'goxCapKhusus' | 'promoXtraCap' | 'promoXtraPlusCap' | 'mallPaymentCap'): number {
  switch (key) {
    case 'orderProcessing': return feesData.other_fees.biaya_proses_pesanan.amount;
    case 'goxCapBiasa': return feesData.gox.cap_per_kuantitas.biasa;
    case 'goxCapKhusus': return feesData.gox.cap_per_kuantitas.khusus;
    case 'promoXtraCap': return feesData.promo_xtra.cap_per_kuantitas;
    case 'promoXtraPlusCap': return feesData.promo_xtra_plus.cap_per_kuantitas;
    case 'mallPaymentCap': return feesData.other_fees.biaya_pembayaran_mall.cap_per_kuantitas;
  }
}
