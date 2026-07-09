import { createClient } from "@libsql/client";
import path from "path";

export const dbOwner = createClient({
  url: process.env.DATABASE_OWNER_URL || `file:${path.join(process.cwd(), "database", "owner.db")}`,
});

export const dbErafone = createClient({
  url: process.env.DATABASE_ERAFONE_URL || `file:${path.join(process.cwd(), "database", "erafone.db")}`,
});
