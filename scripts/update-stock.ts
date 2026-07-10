import { dbOwner, dbErafone } from "../lib/db";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function formatRupiah(num: number): string {
  return "Rp " + num.toLocaleString("id-ID");
}

async function main() {
  console.log("\n=============================================");
  console.log("   BAGASKARA CELL - STOK MANAGER UTILITY     ");
  console.log("=============================================\n");
  
  try {
    const keyword = await ask("Cari nama HP (contoh: 'Redmi Note 13' atau kosongkan untuk semua): ");
    
    let query = "SELECT id, name, brand, 0 as isErafone FROM products";
    let args: string[] = [];
    if (keyword) {
      query += " WHERE name LIKE ? OR brand LIKE ?";
      args = [`%${keyword}%`, `%${keyword}%`];
    }
    query += " LIMIT 20";
    
    // Fetch local owner products
    const ownerRes = await dbOwner.execute({ sql: query, args });
    
    // Fetch scraped Erafone products
    let queryErafone = "SELECT id, name, brand, 1 as isErafone FROM products";
    if (keyword) {
      queryErafone += " WHERE name LIKE ? OR brand LIKE ?";
    }
    queryErafone += " LIMIT 20";
    const erafoneRes = await dbErafone.execute({ sql: queryErafone, args });
    
    // Combine products list
    const products = [...ownerRes.rows, ...erafoneRes.rows];
    
    if (products.length === 0) {
      console.log("\n[-] Produk tidak ditemukan. Coba keyword lain.");
      rl.close();
      return;
    }
    
    console.log("\nDaftar HP Ditemukan:");
    products.forEach((p, idx) => {
      const typeLabel = p.isErafone === 1 ? "PO Erafone" : "Stok Owner";
      console.log(`  ${idx + 1}. [${p.brand}] ${p.name} (${typeLabel})`);
    });
    
    const prodChoiceStr = await ask(`\nPilih nomor HP (1-${products.length}): `);
    const prodIdx = parseInt(prodChoiceStr) - 1;
    if (isNaN(prodIdx) || prodIdx < 0 || prodIdx >= products.length) {
      console.log("[-] Pilihan nomor HP tidak valid.");
      rl.close();
      return;
    }
    
    const selectedProduct = products[prodIdx];
    const isErafone = selectedProduct.isErafone === 1;
    const targetDb = isErafone ? dbErafone : dbOwner;
    console.log(`\n[+] Memilih: ${selectedProduct.name} (${isErafone ? "Database Erafone" : "Database Owner"})`);
    
    // Fetch variants from selected database
    const variantsRes = await targetDb.execute({
      sql: "SELECT id, color, storage, price, stock FROM variants WHERE productId = ?",
      args: [selectedProduct.id]
    });
    const variants = variantsRes.rows;
    
    if (variants.length === 0) {
      console.log("[-] HP ini belum memiliki varian terdaftar.");
      rl.close();
      return;
    }
    
    console.log("\nDaftar Varian:");
    variants.forEach((v, idx) => {
      const stockStatus = v.stock === "ready" ? "🟢 READY" : "🔴 HABIS";
      console.log(`  ${idx + 1}. Warna: ${v.color} | Memori: ${v.storage} | Harga: ${formatRupiah(Number(v.price))} [Status: ${stockStatus}]`);
    });
    
    const varChoiceStr = await ask(`\nPilih nomor varian yang akan diubah (1-${variants.length}): `);
    const varIdx = parseInt(varChoiceStr) - 1;
    if (isNaN(varIdx) || varIdx < 0 || varIdx >= variants.length) {
      console.log("[-] Pilihan varian tidak valid.");
      rl.close();
      return;
    }
    
    const selectedVariant = variants[varIdx];
    console.log(`\n[+] Mengubah varian: Warna ${selectedVariant.color} (${selectedVariant.storage})`);
    
    console.log("\nPilih status stok baru:");
    console.log("  1. 🟢 READY (Ada / Tersedia)");
    console.log("  2. 🔴 HABIS (Kosong / Terjual)");
    
    const stockChoiceStr = await ask("\nPilih (1 / 2): ");
    let newStock = "";
    if (stockChoiceStr === "1") {
      newStock = "ready";
    } else if (stockChoiceStr === "2") {
      newStock = "habis";
    } else {
      console.log("[-] Pilihan status tidak valid.");
      rl.close();
      return;
    }
    
    // Update db
    await targetDb.execute({
      sql: "UPDATE variants SET stock = ? WHERE id = ?",
      args: [newStock, selectedVariant.id]
    });
    
    console.log(`\n[✓] BERHASIL! Status stok varian [${selectedVariant.color} / ${selectedVariant.storage}] telah diubah menjadi [${newStock.toUpperCase()}].`);
  } catch (err) {
    console.error("[-] Terjadi error saat mengupdate database:", err);
  } finally {
    rl.close();
  }
}

main();
