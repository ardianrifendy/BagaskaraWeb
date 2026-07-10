import { dbErafone } from "../lib/db";
import fs from "fs";
import path from "path";

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        row.push(currentField);
        currentField = '';
        if (row.length > 0 || row.some(x => x !== '')) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField || row.length > 0) {
    row.push(currentField);
    if (row.some(x => x !== '')) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];
  
  const headers = lines[0].map(h => h.trim());
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j].trim() : '';
    }
    results.push(obj);
  }
  
  return results;
}

async function main() {
  console.log("Searching for Erafone scraper CSV files...");
  
  const candidates: { path: string; name: string; time: number }[] = [];
  
  // 1. Check current directory
  fs.readdirSync(process.cwd())
    .filter(f => f.startsWith("katalog_") && f.endsWith(".csv"))
    .forEach(f => {
      const fullPath = path.join(process.cwd(), f);
      candidates.push({
        path: fullPath,
        name: f,
        time: fs.statSync(fullPath).mtime.getTime()
      });
    });
    
  // 2. Check erafone_scraper directory
  const scraperDir = path.join(process.cwd(), "erafone_scraper");
  if (fs.existsSync(scraperDir)) {
    fs.readdirSync(scraperDir)
      .filter(f => f.startsWith("katalog_") && f.endsWith(".csv"))
      .forEach(f => {
        const fullPath = path.join(scraperDir, f);
        candidates.push({
          path: fullPath,
          name: f,
          time: fs.statSync(fullPath).mtime.getTime()
        });
      });
  }

  if (candidates.length === 0) {
    console.error("[-] No CSV file starting with 'katalog_' found in website root or D:\\AntiGravity\\erafone_scraper.");
    process.exit(1);
  }

  // Sort by modification time descending to get the newest file
  candidates.sort((a, b) => b.time - a.time);
  const targetFile = candidates[0];
  console.log(`[+] Found newest file: ${targetFile.path} (last modified: ${new Date(targetFile.time).toLocaleString()})`);

  try {
    const csvContent = fs.readFileSync(targetFile.path, "utf-8");
    const records = parseCSV(csvContent);
    
    if (records.length === 0) {
      console.warn("[-] The CSV file is empty.");
      return;
    }
    
    console.log(`[+] Parsed ${records.length} variant rows from CSV.`);

    // 1. Group records by productId for unique products
    const uniqueProductsMap = new Map<string, Record<string, string>>();
    for (const r of records) {
      if (r.productId) {
        uniqueProductsMap.set(r.productId, r);
      }
    }

    console.log(`[+] Found ${uniqueProductsMap.size} unique products. Importing products...`);
    
    // Import Products
    for (const [productId, r] of uniqueProductsMap.entries()) {
      // Validate columns
      if (!r.brand || !r.name) {
        console.warn(`[-] Skipping invalid product: ${productId}`);
        continue;
      }

      await dbErafone.execute({
        sql: `
          INSERT INTO products (id, brand, name, condition, specSummary, specs, highlights, warranty, completeness, defects, createdAt, isScraped, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT(id) DO UPDATE SET
            brand=excluded.brand,
            name=excluded.name,
            condition=excluded.condition,
            specSummary=excluded.specSummary,
            specs=excluded.specs,
            highlights=excluded.highlights,
            warranty=excluded.warranty,
            completeness=excluded.completeness,
            defects=excluded.defects,
            isScraped=1,
            description=excluded.description
        `,
        args: [
          productId,
          r.brand,
          r.name,
          r.condition || "baru",
          r.specSummary || "-",
          r.specs || "[]",
          r.highlights || "[]",
          r.warranty || "Garansi Resmi",
          r.completeness || "Fullset",
          r.defects || "[]",
          r.createdAt || new Date().toISOString(),
          r.description || ""
        ]
      });
    }
    console.log("[+] Products upsert complete.");

    console.log("Importing variants...");
    
    // Import Variants
    let successCount = 0;
    for (const r of records) {
      if (!r.variantId || !r.productId) {
        continue;
      }
      
      const price = parseInt(r.price) || 0;
      const strikePrice = r.strikePrice ? parseInt(r.strikePrice) : null;
      const stock = r.stock.toLowerCase() === "ready" ? "ready" : "habis";
      
      // Parse image list
      const imagesList = r.Image_URLs
        ? r.Image_URLs.split(",")
            .map(u => u.trim())
            .filter(u => u !== "")
        : [];
      const imagesJson = JSON.stringify(imagesList);

      await dbErafone.execute({
        sql: `
          INSERT INTO variants (id, productId, color, colorHex, storage, price, strikePrice, stock, images, skuInduk)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            productId=excluded.productId,
            color=excluded.color,
            colorHex=excluded.colorHex,
            storage=excluded.storage,
            price=excluded.price,
            strikePrice=excluded.strikePrice,
            stock=excluded.stock,
            images=excluded.images,
            skuInduk=excluded.skuInduk
        `,
        args: [
          r.variantId,
          r.productId,
          r.color || "-",
          r.colorHex || "#8e8e93",
          r.storage || "-",
          price,
          strikePrice,
          stock,
          imagesJson,
          r.SKU_Induk || ""
        ]
      });
      successCount++;
    }

    console.log(`[+] Database import complete. Successfully upserted ${successCount} variants.`);
  } catch (error) {
    console.error("[-] Import failed:", error);
  }
}

main();
