/**
 * Removes only the seeded demo accounts and everything cascading from them.
 * Real accounts, topics and other data are untouched.
 */
import postgres from "postgres";
import { assertNotProduction } from "../src/lib/db/env-guard";
import { poolSize } from "../src/lib/db/pool";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

try {
  assertNotProduction("db:unseed");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const host = new URL(url).hostname;
const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

const sql = postgres(url, {
  prepare: false,
  max: poolSize(),
  onnotice: () => {},
  ...(local ? {} : { ssl: "require" as const }),
});

async function main() {
  const before = await sql`
    select count(*)::int as n from auth.users where email like '%@example.test'
  `;

  // Profiles cascade from auth.users; chirps, likes, follows and the rest cascade
  // from profiles. Shared topics are left in place.
  const deleted = await sql`
    delete from auth.users
    where email like '%@example.test'
    returning id
  `;

  const after = await sql`
    select count(*)::int as n from auth.users where email like '%@example.test'
  `;

  console.log(
    `Removed ${deleted.length} seed accounts (${before[0].n} before, ${after[0].n} after).`,
  );
}

main()
  .catch((error) => {
    console.error("Unseed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
