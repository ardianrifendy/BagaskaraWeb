import { createClient } from "@libsql/client";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "erafone.db");
const db = createClient({
  url: `file:${dbPath}`
});

async function main() {
  console.log("Mengubah journal_mode=delete untuk erafone.db agar bisa dibaca di serverless Vercel...");
  await db.execute("PRAGMA journal_mode=delete");
  const res = await db.execute("PRAGMA journal_mode");
  console.log("Journal mode erafone.db saat ini:", res.rows[0][0]);
  db.close();
}

main();
