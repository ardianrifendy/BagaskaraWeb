import { createClient } from "@libsql/client";
import path from "path";

const ownerPath = path.join(process.cwd(), "database", "owner.db");
const erafonePath = path.join(process.cwd(), "database", "erafone.db");

async function setDelete(dbPath: string, name: string) {
  const db = createClient({
    url: `file:${dbPath}`
  });
  console.log(`Mengubah journal_mode=delete untuk ${name} agar bisa dibaca di serverless Vercel...`);
  await db.execute("PRAGMA journal_mode=delete");
  const res = await db.execute("PRAGMA journal_mode");
  console.log(`Journal mode ${name} saat ini:`, res.rows[0][0]);
  db.close();
}

async function main() {
  try {
    await setDelete(ownerPath, "owner.db");
    await setDelete(erafonePath, "erafone.db");
    console.log("Kedua database lokal berhasil diubah ke mode delete!");
  } catch (err) {
    console.error("Gagal mengubah ke mode delete:", err);
  }
}

main();
