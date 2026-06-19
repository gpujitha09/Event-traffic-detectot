import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const hasDb = !!process.env.DATABASE_URL;

if (!hasDb) {
  console.warn("DATABASE_URL is not set. Database operations will use in-memory fallbacks.");
}

export const pool = hasDb ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = pool ? drizzle(pool, { schema }) : null as any;

export * from "./schema";
