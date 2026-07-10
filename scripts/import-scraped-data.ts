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

function copyFolderRecursiveSync(from: string, to: string): number {
  if (!fs.existsSync(from)) return 0;
  let copiedCount = 0;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copiedCount += copyFolderRecursiveSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
      copiedCount++;
    }
  });
  return copiedCount;
}

function resolveLocalImages(brand: string, productName: string, color: string, warna: string): string[] {
  const brandDirName = brand.toLowerCase() === "poco" ? "POCO" : (brand.toLowerCase() === "infinix" ? "Infinix" : brand);
  const brandDir = path.join(process.cwd(), "public", "images", brandDirName);
  
  if (!fs.existsSync(brandDir)) {
    return [];
  }
  
  // Try both color and warna as folder name
  let targetFolder = path.join(brandDir, productName, color);
  let colorFolderName = color;
  if (!fs.existsSync(targetFolder)) {
    targetFolder = path.join(brandDir, productName, warna);
    colorFolderName = warna;
  }
  
  if (!fs.existsSync(targetFolder)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(targetFolder);
    const imgFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
    });
    
    // Sort files numerically by indexing pattern: e.g. sku_color_index.ext
    imgFiles.sort((a, b) => {
      const matchA = a.match(/_(\d+)\.(png|jpg|jpeg|webp)$/i);
      const matchB = b.match(/_(\d+)\.(png|jpg|jpeg|webp)$/i);
      const indexA = matchA ? parseInt(matchA[1]) : 999;
      const indexB = matchB ? parseInt(matchB[1]) : 999;
      return indexA - indexB;
    });
    
    return imgFiles.map(f => `/images/${brandDirName}/${productName}/${colorFolderName}/${f}`);
  } catch (err) {
    console.error(`[-] Error reading ${brandDirName} image folder: ${err}`);
    return [];
  }
}

async function main() {
  let targetFilePath = "";
  let targetFileTime = 0;

  if (process.argv[2]) {
    targetFilePath = path.resolve(process.argv[2]);
    if (!fs.existsSync(targetFilePath)) {
      console.error(`[-] Specified CSV file does not exist: ${targetFilePath}`);
      process.exit(1);
    }
    targetFileTime = fs.statSync(targetFilePath).mtime.getTime();
    console.log(`[+] Using explicitly provided CSV file: ${targetFilePath}`);
  } else {
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
    targetFilePath = targetFile.path;
    targetFileTime = targetFile.time;
    console.log(`[+] Found newest file: ${targetFilePath} (last modified: ${new Date(targetFileTime).toLocaleString()})`);
  }

  // Sync POCO images if src folder exists
  const pocoImagesSrc = path.join(process.cwd(), "erafone_scraper", "images_mi", "POCO");
  const pocoImagesDest = path.join(process.cwd(), "public", "images", "POCO");
  if (fs.existsSync(pocoImagesSrc)) {
    console.log(`[+] Found POCO images at scraper directory. Syncing to ${pocoImagesDest}...`);
    const copied = copyFolderRecursiveSync(pocoImagesSrc, pocoImagesDest);
    console.log(`[+] Synced ${copied} POCO image files to public assets.`);
  } else {
    console.log("[-] No POCO images folder found at erafone_scraper/images_mi/POCO.");
  }

  // Sync Infinix images if src folder exists
  const infinixImagesSrc = path.join(process.cwd(), "erafone_scraper", "images", "Infinix");
  const infinixImagesDest = path.join(process.cwd(), "public", "images", "Infinix");
  if (fs.existsSync(infinixImagesSrc)) {
    console.log(`[+] Found Infinix images at scraper directory. Syncing to ${infinixImagesDest}...`);
    const copied = copyFolderRecursiveSync(infinixImagesSrc, infinixImagesDest);
    console.log(`[+] Synced ${copied} Infinix image files to public assets.`);
  } else {
    console.log("[-] No Infinix images folder found at erafone_scraper/images/Infinix.");
  }

  try {
    const csvContent = fs.readFileSync(targetFilePath, "utf-8");
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

      // Filter out non-phone/non-tablet products
      const lowerId = productId.toLowerCase();
      const lowerName = r.name.toLowerCase();
      if (
        lowerId.includes("xbuds") ||
        lowerId.includes("xwatch") ||
        lowerId.includes("xband") ||
        lowerName.includes("buds") ||
        lowerName.includes("watch") ||
        lowerName.includes("band") ||
        lowerName.includes("earbuds")
      ) {
        console.log(`[Skip] Skipping non-phone/non-tablet product: ${r.name}`);
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

      // Filter out non-phone/non-tablet variants
      const lowerId = r.productId.toLowerCase();
      const lowerName = r.name.toLowerCase();
      if (
        lowerId.includes("xbuds") ||
        lowerId.includes("xwatch") ||
        lowerId.includes("xband") ||
        lowerName.includes("buds") ||
        lowerName.includes("watch") ||
        lowerName.includes("band") ||
        lowerName.includes("earbuds")
      ) {
        continue;
      }
      
      const price = parseInt(r.price) || 0;
      const strikePrice = r.strikePrice ? parseInt(r.strikePrice) : null;
      const stock = r.stock.toLowerCase() === "ready" ? "ready" : "habis";
      
      let imagesList: string[] = [];
      const brandLower = r.brand ? r.brand.toLowerCase() : "";
      if (brandLower === "poco" || brandLower === "infinix") {
        imagesList = resolveLocalImages(r.brand, r.name, r.color, r.Warna);
      }
      
      // Fallback to remote URLs if no local images found or not POCO/Infinix
      if (imagesList.length === 0) {
        imagesList = r.Image_URLs
          ? r.Image_URLs.split(",")
              .map(u => u.trim())
              .filter(u => u !== "")
          : [];
      }
      
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
