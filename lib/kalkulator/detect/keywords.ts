export interface CategoryEntry {
  key: string;
  label: string;
  adminPct: { regular: number; mall: number };
  goxPct: { biasa: number; khusus: number };
  keywords: string[];
}

export const CATEGORY_DICTIONARY: CategoryEntry[] = [
  // ==================== ELEKTRONIK ====================
  {
    key: 'elektronik.handphone',
    label: 'Elektronik - Handphone',
    adminPct: { regular: 5.25, mall: 4.70 },
    goxPct: { biasa: 1.0, khusus: 2.5 },
    keywords: ['handphone', 'hp', 'smartphone', 'ponsel', 'iphone', 'android', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'infinix']
  },
  {
    key: 'elektronik.tablet',
    label: 'Elektronik - Tablet',
    adminPct: { regular: 5.25, mall: 4.70 },
    goxPct: { biasa: 1.0, khusus: 2.5 },
    keywords: ['tablet', 'ipad', 'tab', 'xiaomi pad', 'samsung tab']
  },
  {
    key: 'elektronik.laptop',
    label: 'Elektronik - Laptop',
    adminPct: { regular: 5.25, mall: 4.20 },
    goxPct: { biasa: 1.0, khusus: 2.5 },
    keywords: ['laptop', 'notebook', 'macbook', 'asus', 'acer', 'lenovo', 'hp laptop', 'thinkpad']
  },
  {
    key: 'elektronik.desktop',
    label: 'Elektronik - Desktop PC / Monitor',
    adminPct: { regular: 5.25, mall: 4.20 },
    goxPct: { biasa: 1.0, khusus: 2.5 },
    keywords: ['desktop', 'pc', 'komputer', 'aio', 'all in one pc', 'monitor', 'layar pc']
  },
  {
    key: 'elektronik.komponen_pc',
    label: 'Elektronik - Komponen Desktop & Laptop',
    adminPct: { regular: 5.25, mall: 4.20 },
    goxPct: { biasa: 2.0, khusus: 3.5 },
    keywords: ['motherboard', 'vga', 'gpu', 'ram', 'processor', 'cpu', 'power supply', 'psu', 'casing pc', 'fan pc', 'heatsink']
  },
  {
    key: 'elektronik.penyimpanan_data',
    label: 'Elektronik - Penyimpanan Data',
    adminPct: { regular: 5.25, mall: 4.20 },
    goxPct: { biasa: 3.5, khusus: 5.0 },
    keywords: ['flashdisk', 'ssd', 'hdd', 'hardisk', 'hard disk', 'memory card', 'microsd', 'sd card', 'flash drive']
  },
  {
    key: 'elektronik.aksesoris_hp_casing',
    label: 'Elektronik - Aksesoris HP (casing, charger, dll)',
    adminPct: { regular: 10.0, mall: 10.2 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['casing', 'case', 'softcase', 'hardcase', 'charger', 'kabel data', 'tempered glass', 'anti gores', 'tongsis', 'holder hp', 'skin hp', 'popsocket', 'tripod hp']
  },
  {
    key: 'elektronik.powerbank',
    label: 'Elektronik - Powerbank',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['powerbank', 'power bank', 'portable charger']
  },
  {
    key: 'elektronik.aksesoris_hp_modem',
    label: 'Elektronik - Aksesoris HP (modem/USB/OTG)',
    adminPct: { regular: 6.75, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['modem', 'usb', 'otg', 'kabel otg', 'card reader', 'dongle', 'mifi']
  },
  {
    key: 'elektronik.earphone',
    label: 'Elektronik - Earphone/Headphone/TWS',
    adminPct: { regular: 6.75, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['earphone', 'headphone', 'headset', 'tws', 'airpods', 'earbuds', 'handsfree', 'bluetooth earphone']
  },
  {
    key: 'elektronik.audio_speaker',
    label: 'Elektronik - Speaker & Audio System',
    adminPct: { regular: 9.00, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['speaker', 'audio', 'soundbar', 'amplifier', 'mixer', 'mikrofon', 'mic', 'karaoke']
  },
  {
    key: 'elektronik.baterai',
    label: 'Elektronik - Baterai',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['baterai', 'batre', 'battery', 'baterai aa', 'baterai aaa', 'baterai laptop', 'baterai hp']
  },
  {
    key: 'elektronik.smartwatch_wearable',
    label: 'Elektronik - Smartwatch / Wearable',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['smartwatch', 'smart band', 'apple watch', 'jam pintar', 'mi band', 'fitbit']
  },
  {
    key: 'elektronik.cctv_keamanan',
    label: 'Elektronik - Kamera Keamanan / CCTV',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['cctv', 'ip camera', 'kamera cctv', 'cctv wifi', 'security camera']
  },
  {
    key: 'elektronik.kamera_lensa',
    label: 'Elektronik - Kamera, Lensa & Drone',
    adminPct: { regular: 6.50, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['kamera', 'camera', 'dslr', 'mirrorless', 'lensa', 'lens', 'drone', 'action cam', 'gopro']
  },
  {
    key: 'elektronik.tv_aksesoris',
    label: 'Elektronik - TV & Aksesoris',
    adminPct: { regular: 6.50, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['tv', 'televisi', 'smart tv', 'android tv', 'remot tv', 'bracket tv', 'set top box', 'stb']
  },
  {
    key: 'elektronik.kartu_perdana',
    label: 'Elektronik - Kartu Perdana & Voucher',
    adminPct: { regular: 9.00, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['kartu perdana', 'sim card', 'kuota', 'voucher data', 'simcard']
  },

  // ==================== FASHION ====================
  {
    key: 'fashion.pakaian_pria',
    label: 'Fashion - Pakaian Pria & Muslim Pria',
    adminPct: { regular: 8.25, mall: 9.95 },
    goxPct: { biasa: 6.5, khusus: 8.0 },
    keywords: ['kaos pria', 'kemeja pria', 'celana pria', 'jaket pria', 'sweater', 'hoodie', 'koko', 'sarung', 'gamis pria']
  },
  {
    key: 'fashion.pakaian_wanita',
    label: 'Fashion - Pakaian Wanita & Muslim Wanita',
    adminPct: { regular: 8.25, mall: 9.95 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['kaos wanita', 'dress', 'blouse', 'tunik', 'rok', 'celana wanita', 'gamis wanita', 'hijab', 'jilbab', 'mukena', 'khimar']
  },
  {
    key: 'fashion.sepatu',
    label: 'Fashion - Sepatu & Sandal (Pria / Wanita)',
    adminPct: { regular: 9.00, mall: 10.20 },
    goxPct: { biasa: 6.5, khusus: 8.0 },
    keywords: ['sepatu', 'sandal', 'sneakers', 'flat shoes', 'boots', 'heels', 'sepatu pria', 'sepatu wanita']
  },
  {
    key: 'fashion.tas',
    label: 'Fashion - Tas & Koper',
    adminPct: { regular: 9.00, mall: 10.20 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['tas', 'bag', 'ransel', 'backpack', 'sling bag', 'tas selempang', 'dompet', 'wallet', 'koper', 'suitcase']
  },
  {
    key: 'fashion.jam_tangan',
    label: 'Fashion - Jam Tangan',
    adminPct: { regular: 9.00, mall: 10.20 },
    goxPct: { biasa: 8.0, khusus: 9.5 },
    keywords: ['jam tangan', 'arloji', 'watch', 'jam analog', 'jam digital']
  },
  {
    key: 'fashion.aksesoris',
    label: 'Fashion - Aksesoris Fashion',
    adminPct: { regular: 9.00, mall: 10.20 },
    goxPct: { biasa: 8.0, khusus: 9.5 },
    keywords: ['kacamata', 'topi', 'ikat pinggang', 'sabuk', 'dasi', 'syal', 'anting', 'kalung', 'gelang', 'cincin fashion']
  },
  {
    key: 'fashion.logam_mulia',
    label: 'Fashion - Logam Mulia & Perhiasan Berharga',
    adminPct: { regular: 4.25, mall: 3.20 },
    goxPct: { biasa: 2.0, khusus: 3.5 },
    keywords: ['logam mulia', 'emas', 'perhiasan emas', 'berlian', 'antam', 'perak']
  },

  // ==================== FMCG / KESEHATAN / KECANTIKAN ====================
  {
    key: 'fmcg.perawatan_kecantikan',
    label: 'FMCG - Perawatan & Kecantikan',
    adminPct: { regular: 8.25, mall: 9.95 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['kosmetik', 'skincare', 'parfum', 'serum', 'lipstik', 'sunscreen', 'shampoo', 'sabun mandi', 'perawatan rambut', 'body lotion']
  },
  {
    key: 'fmcg.makanan_minuman',
    label: 'FMCG - Makanan & Minuman',
    adminPct: { regular: 9.50, mall: 10.20 },
    goxPct: { biasa: 6.0, khusus: 7.5 },
    keywords: ['makanan', 'cemilan', 'snack', 'kopi', 'teh', 'susu', 'biskuit', 'mie instan', 'sirup', 'madu', 'cokelat']
  },
  {
    key: 'fmcg.kesehatan_suplemen',
    label: 'FMCG - Kesehatan, Obat & Suplemen',
    adminPct: { regular: 9.00, mall: 7.20 },
    goxPct: { biasa: 6.0, khusus: 7.5 },
    keywords: ['obat', 'vitamin', 'suplemen', 'masker medis', 'paracetamol', 'alat kesehatan', 'tensimeter']
  },
  {
    key: 'fmcg.kesehatan_bayi',
    label: 'FMCG - Kesehatan & Perawatan Bayi (Minyak Telon, Lotion, dll)',
    adminPct: { regular: 8.25, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['minyak telon', 'minyak kayu putih', 'bedak bayi', 'baby lotion', 'baby cream', 'shampoo bayi', 'sabun bayi']
  },
  {
    key: 'fmcg.ibu_bayi',
    label: 'FMCG - Popok & Kebutuhan Bayi',
    adminPct: { regular: 9.00, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['popok', 'pampers', 'diaper', 'susu bayi', 'bubur bayi', 'tisu basah bayi', 'botol susu']
  },

  // ==================== LIFESTYLE / RUMAH TANGGA / HOBI ====================
  {
    key: 'lifestyle.perlengkapan_rumah',
    label: 'Lifestyle - Perlengkapan Rumah & Furniture',
    adminPct: { regular: 10.00, mall: 11.70 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['furniture', 'meja', 'kursi', 'lemari', 'kasur', 'bantal', 'sprei', 'dekorasi', 'lampu hias', 'alat dapur', 'alat pertukangan', 'taman']
  },
  {
    key: 'lifestyle.alat_tulis',
    label: 'Lifestyle - Alat Tulis & Perlengkapan Kantor',
    adminPct: { regular: 9.00, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['buku tulis', 'pulpen', 'pensil', 'kertas hvs', 'penghapus', 'binder', 'stapler', 'alat tulis', 'spidol']
  },
  {
    key: 'lifestyle.hobi_koleksi',
    label: 'Lifestyle - Mainan, Hobi & Koleksi',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 8.0, khusus: 9.5 },
    keywords: ['mainan', 'action figure', 'gundam', 'lego', 'board game', 'alat musik', 'gitar', 'keyboard musik', 'koleksi']
  },
  {
    key: 'lifestyle.olahraga_outdoor',
    label: 'Lifestyle - Olahraga & Outdoor',
    adminPct: { regular: 10.00, mall: 11.70 },
    goxPct: { biasa: 8.0, khusus: 9.5 },
    keywords: ['tenda', 'alat camping', 'sepeda', 'raket badminton', 'bola basket', 'jersey', 'matras yoga', 'barbell', 'pakaian olahraga']
  },
  {
    key: 'lifestyle.otomotif_aksesoris',
    label: 'Lifestyle - Aksesoris Otomotif (Mobil / Motor)',
    adminPct: { regular: 8.25, mall: 10.45 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['helm', 'oli motor', 'oli mobil', 'suku cadang', 'sparepart', 'aksesoris mobil', 'aksesoris motor', 'sarung motor', 'ban motor']
  },
  {
    key: 'lifestyle.kendaraan_unit',
    label: 'Lifestyle - Kendaraan (Unit Mobil / Motor)',
    adminPct: { regular: 2.50, mall: 2.50 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['unit motor', 'unit mobil', 'sepeda motor', 'mobil baru']
  },
  {
    key: 'lifestyle.hewan_peliharaan',
    label: 'Lifestyle - Hewan Peliharaan & Pakan Hewan',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 8.0, khusus: 9.5 },
    keywords: ['pakan', 'pakan burung', 'makanan hewan', 'kucing', 'anjing', 'burung', 'hewan peliharaan', 'pasir kucing', 'aquarium', 'ikan hias', 'whiskas', 'royal canin']
  },
  {
    key: 'fmcg.sembako',
    label: 'FMCG - Bahan Pokok & Sembako (Beras, Susu Formula, Mie)',
    adminPct: { regular: 6.75, mall: 6.20 },
    goxPct: { biasa: 6.0, khusus: 7.5 },
    keywords: ['beras', 'minyak goreng', 'susu formula', 'susu bayi', 'telur', 'mie instan', 'gula', 'tepung', 'sembako', 'bahan pokok', 'sgm', 'lactogrow', 'pediasure', 'baking', 'indomie', 'sedap', 'mentega', 'kecap']
  },
  {
    key: 'elektronik.appliances',
    label: 'Elektronik - Peralatan Rumah Tangga & Perangkat Dapur',
    adminPct: { regular: 6.50, mall: 7.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['kulkas', 'mesin cuci', 'air conditioner', 'ac', 'kipas angin', 'blender', 'rice cooker', 'magic com', 'dispenser', 'oven', 'microwave', 'air fryer', 'purifier', 'mixer dapur', 'chopper', 'kompor gas', 'kompor induksi']
  },
  {
    key: 'elektronik.console',
    label: 'Elektronik - Konsol Game & Video Game',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['playstation', 'ps5', 'ps4', 'nintendo switch', 'nintendo', 'xbox', 'stick ps', 'kaset game', 'video game', 'console', 'gamepad']
  },
  {
    key: 'lifestyle.perawatan_rumah',
    label: 'Lifestyle - Perawatan Rumah & Kebersihan (Detergen, Tisu)',
    adminPct: { regular: 9.00, mall: 10.45 },
    goxPct: { biasa: 7.5, khusus: 9.0 },
    keywords: ['detergen', 'so klin', 'rinso', 'tisu', 'tissue', 'pewangi pakaian', 'downy', 'molto', 'pembersih lantai', 'cairan pencuci piring', 'sunlight', 'mama lemon', 'karbol', 'wipol']
  },
  {
    key: 'fashion.anak',
    label: 'Fashion - Pakaian Bayi & Anak',
    adminPct: { regular: 9.00, mall: 10.20 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['baju bayi', 'pakaian anak', 'baju anak', 'sepatu anak', 'kaos anak', 'setelan anak', 'jumper bayi', 'popok kain', 'clodi', 'piyama anak']
  },
  {
    key: 'lainnya.digital',
    label: 'Lainnya - Pulsa, Paket Data & Voucher Streaming',
    adminPct: { regular: 9.50, mall: 7.70 },
    goxPct: { biasa: 5.5, khusus: 7.0 },
    keywords: ['pulsa', 'paket data', 'token listrik', 'voucher streaming', 'netflix', 'spotify', 'mobile legends', 'top up game', 'telkomsel', 'indosat', 'xl', 'axis', 'smartfren']
  }
];
