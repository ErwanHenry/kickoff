import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use unpooled URL for serverless driver (@neondatabase/serverless requires direct connection)
// The pooled URL (-pooler) uses PgBouncer which doesn't work with the HTTP driver
const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
