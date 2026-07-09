import { dbOwner } from "../lib/db";

async function main() {
  console.log("Initializing SQLite Database...");

  try {
    // 1. Drop existing tables if any
    console.log("Dropping existing tables (if any)...");
    await dbOwner.execute("DROP TABLE IF EXISTS variants");
    await dbOwner.execute("DROP TABLE IF EXISTS products");

    // 2. Create tables
    console.log("Creating tables...");
    await dbOwner.execute(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        name TEXT NOT NULL,
        condition TEXT NOT NULL,
        specSummary TEXT NOT NULL,
        specs TEXT NOT NULL,
        highlights TEXT NOT NULL,
        warranty TEXT,
        completeness TEXT,
        defects TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    await dbOwner.execute(`
      CREATE TABLE variants (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        color TEXT NOT NULL,
        colorHex TEXT NOT NULL,
        storage TEXT NOT NULL,
        price INTEGER NOT NULL,
        strikePrice INTEGER,
        stock TEXT NOT NULL,
        images TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )
    `);

    console.log("Seeding products...");

    // Seed Data
    const products = [
      {
        id: "redmi-note-13-pro",
        brand: "Xiaomi",
        name: "Redmi Note 13 Pro 4G",
        condition: "baru",
        specSummary: "8/256 · Helio G99-Ultra · 5000mAh · 200MP",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "AMOLED, 1B colors, 120Hz" },
              { label: "Ukuran", value: "6.67 inci" },
              { label: "Resolusi", value: "1080 x 2400 piksel (~395 ppi)" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "MediaTek Helio G99-Ultra" },
              { label: "RAM", value: "8 GB" },
              { label: "Penyimpanan", value: "256 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "200 MP (wide) + 8 MP (ultrawide) + 2 MP (macro)" },
              { label: "Kamera Depan", value: "16 MP (wide)" }
            ]
          },
          {
            group: "Baterai",
            items: [
              { label: "Kapasitas", value: "5000 mAh" },
              { label: "Pengisian Daya", value: "67W Turbo Charge (100% dalam 46 menit)" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "Helio G99-Ultra" },
          { icon: "smartphone", label: "Layar", value: "AMOLED 120Hz" },
          { icon: "camera", label: "Kamera", value: "200 MP OIS" },
          { icon: "battery", label: "Baterai", value: "5000 mAh / 67W" }
        ]),
        warranty: "Garansi Resmi Xiaomi Indonesia 15 Bulan",
        completeness: "Fullset Original bawaan pabrik",
        defects: JSON.stringify([]),
        createdAt: new Date().toISOString()
      },
      {
        id: "iphone-11-second",
        brand: "Apple",
        name: "iPhone 11 (Second)",
        condition: "second",
        specSummary: "64GB · A13 Bionic · Liquid Retina LCD · BH 85%",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "Liquid Retina IPS LCD, 625 nits" },
              { label: "Ukuran", value: "6.1 inci" },
              { label: "Resolusi", value: "828 x 1792 piksel (~326 ppi)" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "Apple A13 Bionic (7 nm+)" },
              { label: "RAM", value: "4 GB" },
              { label: "Penyimpanan", value: "64 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "12 MP (wide) + 12 MP (ultrawide)" },
              { label: "Kamera Depan", value: "12 MP (wide) + SL 3D" }
            ]
          },
          {
            group: "Baterai",
            items: [
              { label: "Kapasitas", value: "3110 mAh" },
              { label: "Kondisi Baterai", value: "Battery Health 85%" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "A13 Bionic" },
          { icon: "smartphone", label: "Layar", value: "6.1' Liquid Retina" },
          { icon: "camera", label: "Kamera", value: "Dual 12 MP UltraWide" },
          { icon: "battery", label: "Baterai", value: "BH 85% Sinyal On" }
        ]),
        warranty: "Garansi Toko 1 Bulan (Sinyal Selamanya / Imei Terdaftar Kemenperin)",
        completeness: "Fullset Box & Charger OEM",
        defects: JSON.stringify([
          "Lecet halus pemakaian wajar di bagian sudut bawah",
          "Kondisi Battery Health 85% original bawaan"
        ]),
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour older
      },
      {
        id: "samsung-galaxy-a55-5g",
        brand: "Samsung",
        name: "Samsung Galaxy A55 5G",
        condition: "like-new",
        specSummary: "8/256 · Exynos 1480 · 5000mAh · IP67",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "Super AMOLED, 120Hz, HDR10+" },
              { label: "Ukuran", value: "6.6 inci (Gorilla Glass Victus+)" },
              { label: "Resolusi", value: "1080 x 2340 piksel" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "Exynos 1480 (4 nm)" },
              { label: "RAM", value: "8 GB" },
              { label: "Penyimpanan", value: "256 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "50 MP (wide) OIS + 12 MP (ultrawide) + 5 MP (macro)" },
              { label: "Kamera Depan", value: "32 MP (wide)" }
            ]
          },
          {
            group: "Baterai & Fitur",
            items: [
              { label: "Kapasitas", value: "5000 mAh" },
              { label: "Pengisian Daya", value: "25W Fast Charging" },
              { label: "Keamanan", value: "Sertifikasi Anti Air/Debu IP67" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "Exynos 1480 (4nm)" },
          { icon: "smartphone", label: "Layar", value: "Super AMOLED 120Hz" },
          { icon: "camera", label: "Kamera", value: "50 MP OIS" },
          { icon: "shield", label: "Ketahanan", value: "IP67 Tahan Air" }
        ]),
        warranty: "Garansi Resmi Samsung Indonesia s.d. Oktober 2026",
        completeness: "Fullset Box + Kabel data C to C Original bawaan",
        defects: JSON.stringify([]),
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours older
      },
      {
        id: "infinix-hot-40-pro",
        brand: "Infinix",
        name: "Infinix Hot 40 Pro",
        condition: "baru",
        specSummary: "8/256 · Helio G99 · 5000mAh · 108MP",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "IPS LCD, 120Hz" },
              { label: "Ukuran", value: "6.78 inci" },
              { label: "Resolusi", value: "1080 x 2460 piksel" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "MediaTek Helio G99 (6nm)" },
              { label: "RAM", value: "8 GB" },
              { label: "Penyimpanan", value: "256 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "108 MP (wide) + 2 MP (macro) + 0.08 MP (aux)" },
              { label: "Kamera Depan", value: "32 MP (wide)" }
            ]
          },
          {
            group: "Baterai",
            items: [
              { label: "Kapasitas", value: "5000 mAh" },
              { label: "Pengisian Daya", value: "33W Fast Charging" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "Helio G99" },
          { icon: "smartphone", label: "Layar", value: "FHD+ 120Hz" },
          { icon: "camera", label: "Kamera", value: "108 MP Utama" },
          { icon: "battery", label: "Baterai", value: "5000 mAh / 33W" }
        ]),
        warranty: "Garansi Resmi Infinix Indonesia 1 Tahun",
        completeness: "Fullset Box + Charger Original + Softcase bawaan",
        defects: JSON.stringify([]),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        id: "oppo-a18",
        brand: "Oppo",
        name: "Oppo A18",
        condition: "baru",
        specSummary: "4/128 · Helio G85 · 5000mAh · Layar 90Hz",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "IPS LCD, 90Hz, 720 nits" },
              { label: "Ukuran", value: "6.56 inci" },
              { label: "Resolusi", value: "720 x 1612 piksel" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "MediaTek Helio G85 (12nm)" },
              { label: "RAM", value: "4 GB" },
              { label: "Penyimpanan", value: "128 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "8 MP (wide) + 2 MP (depth)" },
              { label: "Kamera Depan", value: "5 MP (wide)" }
            ]
          },
          {
            group: "Baterai",
            items: [
              { label: "Kapasitas", value: "5000 mAh" },
              { label: "Pengisian Daya", value: "10W Charging" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "Helio G85" },
          { icon: "smartphone", label: "Layar", value: "90Hz Sunlight Screen" },
          { icon: "camera", label: "Kamera", value: "8 MP Utama" },
          { icon: "battery", label: "Baterai", value: "5000 mAh" }
        ]),
        warranty: "Garansi Resmi Oppo Indonesia 1 Tahun",
        completeness: "Fullset Box + Charger Original",
        defects: JSON.stringify([]),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: "realme-note-50",
        brand: "Realme",
        name: "Realme Note 50",
        condition: "baru",
        specSummary: "4/64 · Unisoc T612 · 5000mAh · IP54",
        specs: JSON.stringify([
          {
            group: "Layar",
            items: [
              { label: "Tipe", value: "IPS LCD, 90Hz, 560 nits" },
              { label: "Ukuran", value: "6.74 inci" },
              { label: "Resolusi", value: "720 x 1600 piksel" }
            ]
          },
          {
            group: "Dapur Pacu",
            items: [
              { label: "Chipset", value: "Unisoc Tiger T612 (12nm)" },
              { label: "RAM", value: "4 GB" },
              { label: "Penyimpanan", value: "64 GB" }
            ]
          },
          {
            group: "Kamera",
            items: [
              { label: "Kamera Utama", value: "13 MP (wide) + 0.08 MP (aux)" },
              { label: "Kamera Depan", value: "5 MP" }
            ]
          },
          {
            group: "Baterai & Fitur",
            items: [
              { label: "Kapasitas", value: "5000 mAh" },
              { label: "Pengisian Daya", value: "10W Charging" },
              { label: "Ketahanan", value: "IP54 Dust & Splash Resistant" }
            ]
          }
        ]),
        highlights: JSON.stringify([
          { icon: "cpu", label: "Chipset", value: "Unisoc T612" },
          { icon: "smartphone", label: "Layar", value: "6.74' 90Hz" },
          { icon: "shield", label: "Ketahanan", value: "IP54 Tahan Cipratan" },
          { icon: "battery", label: "Baterai", value: "5000 mAh" }
        ]),
        warranty: "Garansi Resmi Realme Indonesia 1 Tahun",
        completeness: "Fullset Box + Charger Original",
        defects: JSON.stringify([]),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      }
    ];

    const variants = [
      // Redmi Note 13 Pro 4G
      {
        id: "redmi-note-13-pro-black",
        productId: "redmi-note-13-pro",
        color: "Midnight Black",
        colorHex: "#1a1a2e",
        storage: "8/256",
        price: 3499000,
        strikePrice: 3799000,
        stock: "ready",
        images: JSON.stringify(["/images/products/redmi-note-13-pro-black.jpg"])
      },
      {
        id: "redmi-note-13-pro-green",
        productId: "redmi-note-13-pro",
        color: "Forest Green",
        colorHex: "#1b3d2f",
        storage: "8/256",
        price: 3499000,
        strikePrice: 3799000,
        stock: "ready",
        images: JSON.stringify(["/images/products/redmi-note-13-pro-green.jpg"])
      },
      // iPhone 11 Second
      {
        id: "iphone-11-64gb-black",
        productId: "iphone-11-second",
        color: "Black",
        colorHex: "#000000",
        storage: "64GB",
        price: 4299000,
        strikePrice: 4599000,
        stock: "ready",
        images: JSON.stringify(["/images/products/iphone-11-black.jpg"])
      },
      {
        id: "iphone-11-64gb-white",
        productId: "iphone-11-second",
        color: "White",
        colorHex: "#ffffff",
        storage: "64GB",
        price: 4399000,
        strikePrice: 4599000,
        stock: "ready",
        images: JSON.stringify(["/images/products/iphone-11-white.jpg"])
      },
      // Samsung Galaxy A55 5G
      {
        id: "galaxy-a55-256gb-blue",
        productId: "samsung-galaxy-a55-5g",
        color: "Awesome Iceblue",
        colorHex: "#d2e9f7",
        storage: "8/256",
        price: 5399000,
        strikePrice: 5999000,
        stock: "ready",
        images: JSON.stringify(["/images/products/galaxy-a55-blue.jpg"])
      },
      {
        id: "galaxy-a55-256gb-navy",
        productId: "samsung-galaxy-a55-5g",
        color: "Awesome Navy",
        colorHex: "#1c2430",
        storage: "8/256",
        price: 5299000,
        strikePrice: 5999000,
        stock: "ready",
        images: JSON.stringify(["/images/products/galaxy-a55-navy.jpg"])
      },
      // Infinix Hot 40 Pro
      {
        id: "infinix-hot-40-pro-blue",
        productId: "infinix-hot-40-pro",
        color: "Palm Blue",
        colorHex: "#4c6b8c",
        storage: "8/256",
        price: 1949000,
        strikePrice: 2199000,
        stock: "ready",
        images: JSON.stringify(["/images/products/infinix-hot-40-pro-blue.jpg"])
      },
      // Oppo A18
      {
        id: "oppo-a18-black",
        productId: "oppo-a18",
        color: "Glowing Black",
        colorHex: "#1e1e1e",
        storage: "4/128",
        price: 1399000,
        strikePrice: 1499000,
        stock: "ready",
        images: JSON.stringify(["/images/products/oppo-a18-black.jpg"])
      },
      {
        id: "oppo-a18-blue",
        productId: "oppo-a18",
        color: "Glowing Blue",
        colorHex: "#87ceeb",
        storage: "4/128",
        price: 1399000,
        strikePrice: 1499000,
        stock: "ready",
        images: JSON.stringify(["/images/products/oppo-a18-blue.jpg"])
      },
      // Realme Note 50
      {
        id: "realme-note-50-blue",
        productId: "realme-note-50",
        color: "Sky Blue",
        colorHex: "#adcbe3",
        storage: "4/64",
        price: 1199000,
        strikePrice: 1299000,
        stock: "ready",
        images: JSON.stringify(["/images/products/realme-note-50-blue.jpg"])
      },
      {
        id: "realme-note-50-black",
        productId: "realme-note-50",
        color: "Midnight Black",
        colorHex: "#1f2326",
        storage: "4/64",
        price: 1199000,
        strikePrice: 1299000,
        stock: "habis", // Let's make one variant habis to test stock labels
        images: JSON.stringify(["/images/products/realme-note-50-black.jpg"])
      }
    ];

    // Insert Products
    for (const p of products) {
      await dbOwner.execute({
        sql: `
          INSERT INTO products (id, brand, name, condition, specSummary, specs, highlights, warranty, completeness, defects, createdAt, isScraped)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        args: [
          p.id,
          p.brand,
          p.name,
          p.condition,
          p.specSummary,
          p.specs,
          p.highlights,
          p.warranty,
          p.completeness,
          p.defects,
          p.createdAt
        ]
      });
      console.log(`- Product inserted: ${p.name}`);
    }

    // Insert Variants
    for (const v of variants) {
      await dbOwner.execute({
        sql: `
          INSERT INTO variants (id, productId, color, colorHex, storage, price, strikePrice, stock, images)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          v.id,
          v.productId,
          v.color,
          v.colorHex,
          v.storage,
          v.price,
          v.strikePrice ?? null,
          v.stock,
          v.images
        ]
      });
      console.log(`- Variant inserted: ${v.color} for product ${v.productId}`);
    }

    console.log("Database initialized and seeded successfully!");
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
}

main();
