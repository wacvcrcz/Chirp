import postgres from "postgres";
import { migrate } from "./migrate";
import { isLocalDatabaseUrl } from "../src/lib/db/url";

/**
 * Creates a throwaway database and applies every migration to it. The counter
 * trigger tests then run against TEST_DATABASE_URL.
 *
 * Usage: pnpm db:test-setup
 * Reads TEST_DATABASE_URL (defaults to the local Supabase Postgres on 54322)
 * and TEST_DB_NAME (defaults to chirp_test). On Supabase local, auth.users
 * already exists, so only the chirp schema is applied here.
 */
const serverUrl = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const dbName = process.env.TEST_DB_NAME ?? "chirp_test";

function databaseUrl(name: string) {
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

if (!isLocalDatabaseUrl(serverUrl)) {
  console.error(
    `Refusing to create test databases on ${new URL(serverUrl).hostname}. ` +
      `Tests only run against a local Postgres.`,
  );
  process.exit(1);
}

const admin = postgres(databaseUrl("postgres"), {
  max: 1,
  onnotice: () => {},
  ssl: "require",
});

try {
  const existing = await admin`
    select 1 from pg_database where datname = ${dbName}
  `;
  if (existing.length === 0) {
    await admin.unsafe(`create database "${dbName}"`);
    console.log(`created database ${dbName}`);
  } else {
    console.log(`database ${dbName} already exists`);
  }
} finally {
  await admin.end();
}

// The migrations reference auth.users, which Supabase provides. A bare
// Postgres (CI without Supabase) needs the same minimal shape. Supabase local
// has the real table, so this is a no-op there.
const target = postgres(databaseUrl(dbName), {
  max: 1,
  onnotice: () => {},
  ssl: "require",
});
try {
  await target`
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key,
      email text,
      created_at timestamptz not null default now()
    );
    alter table auth.users enable row level security;
  `;
} finally {
  await target.end();
}

await migrate(databaseUrl(dbName), { log: true });
console.log(`Test database ready: ${databaseUrl(dbName)}`);
