import { createClient } from "@libsql/client";
import path from "path";

const OWNER_URL = process.argv[2];
const OWNER_TOKEN = process.argv[3];
const ERAFONE_URL = process.argv[4];
const ERAFONE_TOKEN = process.argv[5];

if (!OWNER_URL || !OWNER_TOKEN || !ERAFONE_URL || !ERAFONE_TOKEN) {
  console.error("Usage: npx tsx scripts/migrate-to-turso.ts <OWNER_URL> <OWNER_TOKEN> <ERAFONE_URL> <ERAFONE_TOKEN>");
  process.exit(1);
}

const localOwner = createClient({
  url: `file:${path.join(process.cwd(), "database", "owner.db")}`
});
const remoteOwner = createClient({
  url: OWNER_URL,
  authToken: OWNER_TOKEN
});

const localErafone = createClient({
  url: `file:${path.join(process.cwd(), "database", "erafone.db")}`
});
const remoteErafone = createClient({
  url: ERAFONE_URL,
  authToken: ERAFONE_TOKEN
});

async function migrateDb(local: any, remote: any, dbName: string) {
  console.log(`Memulai migrasi untuk ${dbName}...`);

  // Create tables on remote if they don't exist
  await remote.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      condition TEXT CHECK(condition IN ('baru', 'second', 'like-new')) NOT NULL,
      specSummary TEXT NOT NULL,
      specs TEXT NOT NULL,
      highlights TEXT NOT NULL,
      warranty TEXT,
      completeness TEXT,
      defects TEXT,
      createdAt TEXT NOT NULL,
      isScraped INTEGER DEFAULT 0
    )
  `);

  await remote.execute(`
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      color TEXT NOT NULL,
      colorHex TEXT NOT NULL,
      storage TEXT NOT NULL,
      price INTEGER NOT NULL,
      strikePrice INTEGER,
      stock TEXT CHECK(stock IN ('ready', 'habis')) NOT NULL,
      images TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  // Clear existing remote data
  await remote.execute("DELETE FROM variants");
  await remote.execute("DELETE FROM products");

  // Fetch products
  const products = await local.execute("SELECT * FROM products");
  for (const row of products.rows) {
    await remote.execute({
      sql: `
        INSERT INTO products (id, brand, name, condition, specSummary, specs, highlights, warranty, completeness, defects, createdAt, isScraped)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        row.id, row.brand, row.name, row.condition, row.specSummary, 
        row.specs, row.highlights, row.warranty, row.completeness, 
        row.defects, row.createdAt, row.isScraped
      ]
    });
  }
  console.log(`Berhasil memindahkan ${products.rows.length} produk untuk ${dbName}.`);

  // Fetch variants
  const variants = await local.execute("SELECT * FROM variants");
  for (const row of variants.rows) {
    await remote.execute({
      sql: `
        INSERT INTO variants (id, productId, color, colorHex, storage, price, strikePrice, stock, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        row.id, row.productId, row.color, row.colorHex, row.storage, 
        row.price, row.strikePrice, row.stock, row.images
      ]
    });
  }
  console.log(`Berhasil memindahkan ${variants.rows.length} varian untuk ${dbName}.`);
  console.log(`Migrasi untuk ${dbName} selesai!\n`);
}

async function main() {
  try {
    await migrateDb(localOwner, remoteOwner, "DATABASE OWNER");
    await migrateDb(localErafone, remoteErafone, "DATABASE ERAFONE");
    console.log("Semua data berhasil dimigrasikan ke cloud Turso!");
  } catch (err) {
    console.error("Migrasi gagal:", err);
  }
}

main();
