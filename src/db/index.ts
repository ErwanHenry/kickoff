import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use DATABASE_URL for serverless driver
// Note: The @neondatabase/serverless HTTP driver works with both pooled and unpooled URLs
// The comment about PgBouncer only applies to the WebSocket driver (@neondatabase/serverless/ws)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
