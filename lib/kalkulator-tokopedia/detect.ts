import tarifBaruData from '../../data/tarif/tokopedia-2026-05-18.json';
import brandDb from '../../data/tarif/brand-database.json';
import { TokopediaCategory } from './types';

export function detectTokopediaCategory(query: string): TokopediaCategory[] {
  if (!query || !query.trim()) return [];
  const normalized = query.toLowerCase().trim();

  const scores = new Map<string, number>();

  // 1. Check brand database
  for (const cat of brandDb.categories) {
    let bestScoreForCat = 0;
    for (const kw of cat.keywords) {
      const kwLower = kw.toLowerCase();
      if (normalized === kwLower) {
        bestScoreForCat = Math.max(bestScoreForCat, 100);
      } else if (normalized.includes(kwLower)) {
        bestScoreForCat = Math.max(bestScoreForCat, 80 + kwLower.length);
      } else if (kwLower.includes(normalized) && normalized.length >= 2) {
        bestScoreForCat = Math.max(bestScoreForCat, 50 + normalized.length);
      }
    }

    if (bestScoreForCat > 0) {
      scores.set(cat.slug, (scores.get(cat.slug) || 0) + bestScoreForCat);
    }
  }

  // 2. Check official category names
  for (const cat of tarifBaruData.kategori) {
    const nameLower = cat.nama.toLowerCase();
    if (nameLower.includes(normalized) || normalized.includes(nameLower)) {
      scores.set(cat.slug, (scores.get(cat.slug) || 0) + 90);
    }
  }

  // Sort by highest score
  const sortedSlugs = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);

  const results: TokopediaCategory[] = [];
  for (const slug of sortedSlugs) {
    const catData = tarifBaruData.kategori.find((c) => c.slug === slug);
    if (catData) {
      results.push({
        slug: catData.slug,
        nama: catData.nama,
        rateDinamis: catData.rateDinamis,
        rateDinamisLama: catData.rateDinamisLama ?? catData.rateDinamis,
        ratePlatformDefault: catData.ratePlatformDefault
      });
    }
  }

  return results;
}
