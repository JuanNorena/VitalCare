import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuración universal con postgres-js (funciona en Replit y local)
const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : 'require',
  max: 10,
});

export const db = drizzle(sql, { schema });
export const pool = sql;