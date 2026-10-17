import { expect } from "vitest";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertNotProduction } from "./env-guard";
import { poolSize } from "./pool";

/**
 * Non-destructive database test helpers. Tests create their own users through
 * the admin API and delete exactly those users at the end; cascades remove
 * their profiles, chirps, likes, follows and other rows. Nothing is truncated.
 *
 * Database tests only run when RUN_DB_TESTS=1. `pnpm test` stays green without
 * credentials; `pnpm test:db` sets the flag.
 */
export const hasDatabase = process.env.RUN_DB_TESTS === "1";

let asserted = false;

export function testSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for database tests.");
  }
  if (!asserted) {
    assertNotProduction("database tests");
    asserted = true;
  }

  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

  return postgres(url, {
    prepare: false,
    max: poolSize(5),
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
    ...(local ? {} : { ssl: "require" as const }),
  });
}

export type TestUser = {
  id: string;
  email: string;
  username: string;
};

/**
 * Creates a confirmed auth user through the admin API. The profile row is
 * created by the on_auth_user_created trigger, exactly like a real signup.
 */
export async function createTestUser(sql: ReturnType<typeof testSql>): Promise<TestUser> {
  const admin = createAdminClient();
  const email = `test-${uuidv7()}@example.com`;
  const password = `pw-${uuidv7()}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Could not create test user: ${error?.message ?? "no user returned"}`);
  }

  const username = `t_${uuidv7().replace(/-/g, "").slice(0, 12)}`;
  await sql`
    update profiles
    set username = ${username}, display_name = ${username}, onboarded_at = now()
    where id = ${data.user.id}
  `;

  return { id: data.user.id, email, username };
}

/** Deletes the auth user; cascades remove everything the test created. */
export async function deleteTestUser(user: TestUser | undefined): Promise<void> {
  if (!user) return;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  // A failed delete must fail the test run loudly: leftovers are a bug.
  expect(error, `cleanup for ${user.email}`).toBeNull();
}
