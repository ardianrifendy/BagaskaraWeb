import { CATEGORY_DICTIONARY, CategoryEntry } from './keywords';

const EXCLUDED_BRANDS = [
  'iphone', 'samsung', 'xiaomi', 'redmi', 'oppo', 'vivo',
  'realme', 'infinix', 'apple', 'asus', 'acer', 'lenovo',
  'hp', 'dell', 'huawei', 'sony', 'jbl', 'anker', 'ugreen',
  'baseus', 'robot', 'vivan'
];

/**
 * Normalisasi nama produk: lowercase, hapus brand umum, angka model, dan tanda baca.
 */
export function normalizeProductName(name: string): string {
  let normalized = name.toLowerCase();

  // Hapus tanda baca umum
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

  // Tokenize kata
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  // Filter kata yang merupakan brand umum
  const filteredWords = words.filter(word => {
    // Kecualikan "hp" dari filter jika ada kata "aksesoris hp" atau jika "hp" merujuk ke Handphone
    // Namun untuk general brand, kita hapus
    if (word === 'hp') {
      // Kita pertahankan jika dia berkombinasi (nanti ditangani di keyword)
      return true;
    }
    return !EXCLUDED_BRANDS.includes(word);
  });

  return filteredWords.join(' ');
}

/**
 * Mendeteksi kategori dari nama produk.
 * Mengembalikan list CategoryEntry yang diurutkan berdasarkan skor kecocokan tertinggi.
 */
export function detectCategory(productName: string): CategoryEntry[] {
  if (!productName) return [];

  const cleanName = normalizeProductName(productName);
  const resultCandidates: { entry: CategoryEntry; score: number }[] = [];

  for (const entry of CATEGORY_DICTIONARY) {
    let score = 0;

    for (const keyword of entry.keywords) {
      // Prioritaskan kecocokan frasa penuh
      if (cleanName.includes(keyword)) {
        score += keyword.split(' ').length * 2; // Frasa panjang dapat skor lebih tinggi
      } else {
        // Coba cocokan kata per kata jika keyword terdiri dari beberapa kata
        const kwWords = keyword.split(' ');
        if (kwWords.length > 1) {
          let wordMatchCount = 0;
          for (const kww of kwWords) {
            if (cleanName.includes(kww)) wordMatchCount++;
          }
          if (wordMatchCount === kwWords.length) {
            score += kwWords.length;
          }
        }
      }
    }

    if (score > 0) {
      resultCandidates.push({ entry, score });
    }
  }

  // Urutkan candidate berdasarkan skor tertinggi
  resultCandidates.sort((a, b) => b.score - a.score);

  return resultCandidates.map(c => c.entry);
}
