import { createClient } from "@libsql/client";
import path from "path";

interface DBProduct {
  id: string;
  brand: string;
  name: string;
}

interface DBVariant {
  id: string;
  productId: string;
  color: string;
  storage: string;
  price: number;
}

async function main() {
  const oldDb = createClient({
    url: `file:${path.join(process.cwd(), "database.db")}`
  });
  
  const newDb = createClient({
    url: `file:${path.join(process.cwd(), "database", "erafone.db")}`
  });

  try {
    console.log("=== COMPARISON REPORT: OLD CATALOG vs NEWLY SCRAPED CATALOG ===");

    // Fetch Erafone products from old database
    const oldProductsRes = await oldDb.execute("SELECT id, brand, name FROM products WHERE isScraped = 1");
    const oldProducts = new Map<string, DBProduct>(
      oldProductsRes.rows.map(r => [r.id as string, r as unknown as DBProduct])
    );

    // Fetch Erafone products from new database
    const newProductsRes = await newDb.execute("SELECT id, brand, name FROM products WHERE isScraped = 1");
    const newProducts = new Map<string, DBProduct>(
      newProductsRes.rows.map(r => [r.id as string, r as unknown as DBProduct])
    );

    // Fetch Erafone variants from old database
    const oldVariantsRes = await oldDb.execute(
      "SELECT id, productId, color, storage, price FROM variants WHERE productId IN (SELECT id FROM products WHERE isScraped = 1)"
    );
    const oldVariants = new Map<string, DBVariant>(
      oldVariantsRes.rows.map(r => [r.id as string, r as unknown as DBVariant])
    );

    // Fetch Erafone variants from new database
    const newVariantsRes = await newDb.execute(
      "SELECT id, productId, color, storage, price FROM variants WHERE productId IN (SELECT id FROM products WHERE isScraped = 1)"
    );
    const newVariants = new Map<string, DBVariant>(
      newVariantsRes.rows.map(r => [r.id as string, r as unknown as DBVariant])
    );

    // Compare products
    const addedProducts: DBProduct[] = [];
    const removedProducts: DBProduct[] = [];
    
    for (const [id, prod] of newProducts.entries()) {
      if (!oldProducts.has(id)) {
        addedProducts.push(prod);
      }
    }

    for (const [id, prod] of oldProducts.entries()) {
      if (!newProducts.has(id)) {
        removedProducts.push(prod);
      }
    }

    // Compare variants/prices
    const addedVariants: DBVariant[] = [];
    const removedVariants: DBVariant[] = [];
    const priceChanges: { product: string; variant: string; oldPrice: number; newPrice: number }[] = [];

    for (const [id, v] of newVariants.entries()) {
      const oldV = oldVariants.get(id);
      if (!oldV) {
        addedVariants.push(v);
      } else if (Number(oldV.price) !== Number(v.price)) {
        const prod = newProducts.get(v.productId) || oldProducts.get(v.productId);
        priceChanges.push({
          product: prod ? `${prod.brand} ${prod.name}` : v.productId,
          variant: `${v.color} (${v.storage})`,
          oldPrice: Number(oldV.price),
          newPrice: Number(v.price)
        });
      }
    }

    for (const [id, v] of oldVariants.entries()) {
      if (!newVariants.has(id)) {
        removedVariants.push(v);
      }
    }

    console.log(`\n[+] Products Summary:`);
    console.log(`    - Old Total Products: ${oldProducts.size}`);
    console.log(`    - New Total Products: ${newProducts.size}`);
    console.log(`    - New Products Added: ${addedProducts.length}`);
    console.log(`    - Old Products Removed: ${removedProducts.length}`);

    if (addedProducts.length > 0) {
      console.log(`\n[+] Sample Added Products (Showing up to 10):`);
      addedProducts.slice(0, 10).forEach(p => {
        console.log(`    * [${p.brand}] ${p.name}`);
      });
    }

    if (removedProducts.length > 0) {
      console.log(`\n[-] Sample Removed Products (Showing up to 10):`);
      removedProducts.slice(0, 10).forEach(p => {
        console.log(`    * [${p.brand}] ${p.name}`);
      });
    }

    console.log(`\n[+] Variants Summary:`);
    console.log(`    - Old Total Variants: ${oldVariants.size}`);
    console.log(`    - New Total Variants: ${newVariants.size}`);
    console.log(`    - New Variants Added: ${addedVariants.length}`);
    console.log(`    - Old Variants Removed: ${removedVariants.length}`);
    console.log(`    - Price Changes: ${priceChanges.length}`);

    if (priceChanges.length > 0) {
      console.log(`\n[+] Price Changes (Showing up to 15):`);
      priceChanges.slice(0, 15).forEach(c => {
        const diff = c.newPrice - c.oldPrice;
        const diffStr = diff > 0 ? `+Rp ${diff.toLocaleString()}` : `-Rp ${Math.abs(diff).toLocaleString()}`;
        console.log(`    * ${c.product} - ${c.variant}: Rp ${c.oldPrice.toLocaleString()} -> Rp ${c.newPrice.toLocaleString()} (${diffStr})`);
      });
    }

  } catch (err) {
    console.error("Error comparing databases:", err);
  } finally {
    oldDb.close();
    newDb.close();
  }
}

main();
