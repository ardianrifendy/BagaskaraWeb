import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

const ownerPath = path.join(process.cwd(), "database", "owner.db");
const erafonePath = path.join(process.cwd(), "database", "erafone.db");

async function setWal(dbPath: string, name: string) {
  if (!fs.existsSync(dbPath)) {
    console.error(`File ${name} tidak ditemukan di ${dbPath}`);
    return;
  }
  const db = createClient({
    url: `file:${dbPath}`
  });
  console.log(`Mengatur journal_mode=WAL untuk ${name}...`);
  await db.execute("PRAGMA journal_mode=WAL");
  const res = await db.execute("PRAGMA journal_mode");
  console.log(`Journal mode ${name} saat ini:`, res.rows[0][0]);
  db.close();
}

async function main() {
  try {
    await setWal(ownerPath, "owner.db");
    await setWal(erafonePath, "erafone.db");
    console.log("Kedua database lokal berhasil diubah ke mode WAL!");
  } catch (err) {
    console.error("Gagal mengubah ke mode WAL:", err);
  }
}

main();
