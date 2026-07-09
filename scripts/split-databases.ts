import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

async function main() {
  const dbDir = path.join(process.cwd(), "database");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }

  const srcDb = path.join(process.cwd(), "database.db");
  if (!fs.existsSync(srcDb)) {
    console.error("[-] database.db does not exist in root directory.");
    process.exit(1);
  }

  const ownerDb = path.join(dbDir, "owner.db");
  const erafoneDb = path.join(dbDir, "erafone.db");

  console.log("[+] Copying database.db to database/owner.db...");
  fs.copyFileSync(srcDb, ownerDb);
  console.log("[+] Copying database.db to database/erafone.db...");
  fs.copyFileSync(srcDb, erafoneDb);

  // Clean owner.db
  console.log("[+] Cleaning database/owner.db (removing Erafone PO products)...");
  const dbOwner = createClient({ url: `file:${ownerDb}` });
  // Delete variants for scraped products
  const delVariantsOwner = await dbOwner.execute(
    "DELETE FROM variants WHERE productId IN (SELECT id FROM products WHERE isScraped = 1)"
  );
  console.log(`    Deleted ${delVariantsOwner.rowsAffected} variants from owner.db`);
  // Delete products
  const delProductsOwner = await dbOwner.execute(
    "DELETE FROM products WHERE isScraped = 1"
  );
  console.log(`    Deleted ${delProductsOwner.rowsAffected} products from owner.db`);
  dbOwner.close();

  // Clean erafone.db
  console.log("[+] Cleaning database/erafone.db (removing Owner local products)...");
  const dbErafone = createClient({ url: `file:${erafoneDb}` });
  // Delete variants for local products
  const delVariantsErafone = await dbErafone.execute(
    "DELETE FROM variants WHERE productId IN (SELECT id FROM products WHERE isScraped = 0 OR isScraped IS NULL)"
  );
  console.log(`    Deleted ${delVariantsErafone.rowsAffected} variants from erafone.db`);
  // Delete products
  const delProductsErafone = await dbErafone.execute(
    "DELETE FROM products WHERE isScraped = 0 OR isScraped IS NULL"
  );
  console.log(`    Deleted ${delProductsErafone.rowsAffected} products from erafone.db`);
  dbErafone.close();

  console.log("\n[✓] Databases split successfully into two files inside 'database' directory!");
}

main();
