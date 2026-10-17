import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only client. DATABASE_URL is the pooled (transaction mode) string;
 * prepare: false because transaction pooling does not keep prepared statements
 * alive between queries.
 */
if (typeof window !== "undefined") {
  throw new Error("The database client must never be imported in the browser.");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy it from your Supabase project settings.",
  );
}

const client = postgres(connectionString, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const sql = client;
export { schema };
