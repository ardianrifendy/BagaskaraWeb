import tarifBaruData from '../../data/tarif/tokopedia-2026-05-18.json';
import { TokopediaCategory } from './types';

export interface CategoryKeywordRule {
  slug: string;
  keywords: string[];
}

export const TOKOPEDIA_KEYWORD_RULES: CategoryKeywordRule[] = [
  {
    slug: 'telepon-elektronik',
    keywords: ['hp', 'handphone', 'smartphone', 'ponsel', 'iphone', 'android', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'infinix', 'ipad', 'tab']
  },
  {
    slug: 'komputer-peralatan-kantor',
    keywords: ['laptop', 'pc', 'komputer', 'desktop', 'monitor', 'macbook', 'asus', 'acer', 'lenovo', 'thinkpad', 'printer', 'keyboard', 'mouse', 'ssd', 'vga', 'ram', 'processor']
  },
  {
    slug: 'aksesoris-perhiasan-turunannya',
    keywords: ['kalung', 'cincin', 'gelang', 'anting', 'perhiasan', 'mutiara', 'emas', 'perak', 'liontin']
  },
  {
    slug: 'produk-virtual',
    keywords: ['pulsa', 'kuota', 'token', 'pln', 'topup', 'voucher game', 'diamond']
  },
  {
    slug: 'pemesanan-voucher',
    keywords: ['voucher makan', 'hotel', 'tiket', 'travel', 'diskon makanan']
  },
  {
    slug: 'peralatan-rumah-tangga',
    keywords: ['kulkas', 'mesin cuci', 'ac', 'kipas', 'dispenser', 'tv', 'televisi', 'blender', 'microwave']
  },
  {
    slug: 'makanan-minuman',
    keywords: ['snack', 'kopi', 'teh', 'biskuit', 'frozen food', 'makanan', 'minuman', 'beras', 'minyak', 'cokelat', 'mie', 'susu']
  },
  {
    slug: 'kesehatan',
    keywords: ['masker', 'vitamin', 'obat', 'suplemen', 'tensimeter', 'medis', 'oximeter', 'termometer']
  },
  {
    slug: 'olahraga-aktivitas-luar-ruangan',
    keywords: ['sepeda', 'matras', 'yoga', 'jersey', 'tenda', 'raket', 'bola', 'dumbbell', 'treadmill']
  },
  {
    slug: 'furnitur',
    keywords: ['meja', 'kursi', 'lemari', 'kasur', 'sofa', 'rak', 'springbed', 'buffet']
  },
  {
    slug: 'perkakas-perangkat-keras',
    keywords: ['bor', 'obeng', 'tang', 'palu', 'meteran', 'tangga', 'mesin las', 'gerinda']
  },
  {
    slug: 'kecantikan-perawatan-pribadi',
    keywords: ['skincare', 'serum', 'lipstik', 'parfum', 'shampo', 'sabun', 'moisturizer', 'sunscreen', 'make up', 'sunblock']
  },
  {
    slug: 'bayi-ibu-hamil',
    keywords: ['popok', 'pampers', 'susu bayi', 'baju bayi', 'stroller', 'empeng', 'botol susu', 'gendongan']
  },
  {
    slug: 'otomotif-sepeda-motor',
    keywords: ['oli', 'helm', 'ban', 'aki', 'knalpot', 'aksesoris mobil', 'aksesoris motor', 'spion', 'wiper', 'intercom']
  },
  {
    slug: 'perbaikan-rumah',
    keywords: ['cat', 'kuas', 'kran', 'keramik', 'lampu', 'saklar', 'stopkontak', 'pipa', 'bohlam']
  },
  {
    slug: 'aksesoris-fesyen',
    keywords: ['kacamata', 'topi', 'ikat pinggang', 'dompet', 'jam tangan', 'syal', 'sabuk']
  },
  {
    slug: 'busana-anak-anak',
    keywords: ['baju anak', 'kaos anak', 'celana anak', 'gaun anak', 'jaket anak']
  },
  {
    slug: 'perlengkapan-rumah-tangga',
    keywords: ['sapu', 'pel', 'tempat sampah', 'rak piring', 'gantungan baju', 'jemuran']
  },
  {
    slug: 'perlengkapan-hewan-peliharaan',
    keywords: ['makanan kucing', 'cat food', 'dog food', 'kandang', 'pasir kucing', 'aquarium', 'whiskas']
  },
  {
    slug: 'mainan-hobi',
    keywords: ['lego', 'gundam', 'hot wheels', 'boneka', 'puzzle', 'kartu', 'board game', 'diecast', 'rubik']
  },
  {
    slug: 'peralatan-dapur',
    keywords: ['wajan', 'panci', 'pisau dapur', 'piring', 'gelas', 'teflon', 'air fryer', 'sutil']
  },
  {
    slug: 'pakaian-pria-pakaian-dalam',
    keywords: ['kaos pria', 'kemeja pria', 'celana pria', 'boxer', 'jaket pria', 'hoodie', 'sweater']
  },
  {
    slug: 'koper-tas',
    keywords: ['koper', 'ransel', 'backpack', 'tas selempang', 'totebag', 'tas wanita', 'tas pria', 'waistbag']
  },
  {
    slug: 'sepatu',
    keywords: ['sepatu', 'sneakers', 'sandal', 'pantofel', 'heels', 'sepatu wanita', 'sepatu pria', 'boots']
  },
  {
    slug: 'pakaian-wanita-pakaian-dalam',
    keywords: ['daster', 'baju wanita', 'dress', 'tunik', 'blouse', 'bra', 'celana wanita', 'kulot', 'rok']
  },
  {
    slug: 'tekstil-perabot-rumah-tangga',
    keywords: ['sprei', 'bedcover', 'selimut', 'handuk', 'gorden', 'bantal', 'karpet', 'guling']
  },
  {
    slug: 'buku-majalah-audio',
    keywords: ['buku', 'novel', 'komik', 'kamus', 'cd', 'piringan hitam', 'majalah']
  },
  {
    slug: 'barang-koleksi',
    keywords: ['perangko', 'koin', 'barang antik', 'photocard', 'action figure', 'pc kpop']
  },
  {
    slug: 'busana-muslim',
    keywords: ['hijab', 'jilbab', 'mukena', 'gamis', 'baju koko', 'sarung', 'pashmina', 'khimar', 'abaya']
  },
  {
    slug: 'peralatan-perlengkapan-kantor',
    keywords: ['kertas a4', 'pulpen', 'pensil', 'binder', 'map', 'amplop', 'cutter', 'kalkulator', 'stapler']
  }
];

export function detectTokopediaCategory(query: string): TokopediaCategory[] {
  if (!query || !query.trim()) return [];
  const normalized = query.toLowerCase().trim();

  const matchedSlugs = new Set<string>();

  for (const rule of TOKOPEDIA_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))) {
      matchedSlugs.add(rule.slug);
    }
  }

  // Juga match dengan nama kategori langsung
  for (const cat of tarifBaruData.kategori) {
    if (cat.nama.toLowerCase().includes(normalized)) {
      matchedSlugs.add(cat.slug);
    }
  }

  const results: TokopediaCategory[] = [];
  for (const slug of matchedSlugs) {
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
