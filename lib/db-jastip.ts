import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../database/schema-jastip";

const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@placeholder.com/dbname";

const sql = neon(databaseUrl);
export const dbJastip = drizzle(sql, { schema });
