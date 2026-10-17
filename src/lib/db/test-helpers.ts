import postgres from "postgres";

/**
 * Connection helpers for database tests. Tests are skipped unless
 * TEST_DATABASE_URL is set; see AGENTS.md for starting Supabase local.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/chirp_test";

/** Tests are skipped unless the caller asked for a database explicitly. */
export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

export function testClient() {
  return postgres(TEST_DATABASE_URL, {
    prepare: false,
    max: 1,
    onnotice: () => {},
  });
}

/**
 * Wipes data but keeps the schema. Order respects foreign keys.
 */
export async function resetData(sql: ReturnType<typeof testClient>) {
  await sql`
    truncate table
      impressions, notifications, likes, follows, user_topics,
      suggested_accounts, media, chirps, reports, moderation_actions,
      topics, profiles
    restart identity cascade
  `;
  await sql`delete from auth.users`;
}

export async function createUser(
  sql: ReturnType<typeof testClient>,
  id: string,
  username: string,
  displayName = username,
) {
  await sql`
    insert into auth.users (id, email) values (${id}, ${`${username}@example.test`})
  `;
  await sql`
    update profiles
    set username = ${username}, display_name = ${displayName}, onboarded_at = now()
    where id = ${id}
  `;
}
