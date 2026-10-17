import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { isLocalDatabaseUrl } from "../src/lib/db/url";

// Supabase applies these on `supabase db reset`; this runner applies the same
// files to a hosted database (or a throwaway test database) with its own ledger.
const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function connectionOptions(databaseUrl: string) {
  return {
    prepare: false,
    max: 1,
    onnotice: () => {},
    // Hosted Postgres (Supabase pooler) requires TLS; local does not offer it.
    ...(isLocalDatabaseUrl(databaseUrl) ? {} : { ssl: "require" as const }),
  };
}

/**
 * Applies supabase/migrations/*.sql in filename order inside a ledger, so the hand-written
 * migrations (extensions, triggers, RLS) run exactly once per database.
 * Usage: tsx scripts/migrate.ts (reads DATABASE_URL).
 */
export async function migrate(
  databaseUrl: string,
  { log = false }: { log?: boolean } = {},
) {
  const sql = postgres(databaseUrl, connectionOptions(databaseUrl));

  try {
    await sql`
      create table if not exists _chirp_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `;
    // Same rule as application tables: no direct access through the public keys.
    await sql`alter table _chirp_migrations enable row level security`;

    const applied = new Set(
      (await sql`select name from _chirp_migrations`).map((row) => row.name),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      throw new Error(`No migrations found in ${MIGRATIONS_DIR}.`);
    }

    for (const file of files) {
      if (applied.has(file)) continue;
      const body = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into _chirp_migrations (name) values (${file})`;
      });

      if (log) console.log(`applied ${file}`);
    }

    return files.length;
  } finally {
    await sql.end();
  }
}

const isEntrypoint = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/migrate.ts");

if (isEntrypoint) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }
  migrate(url, { log: true })
    .then(() => {
      console.log("Migrations are up to date.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error.message);
      process.exit(1);
    });
}
