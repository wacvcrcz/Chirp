import { afterAll, describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  hasTestDatabase,
  resetData,
  testClient,
} from "@/lib/db/test-helpers";

const sql = hasTestDatabase ? testClient() : null;

describe.skipIf(!hasTestDatabase)("schema", () => {
  afterAll(async () => {
    await sql?.end();
  });

  it("has every table from docs/03", async () => {
    if (!sql) return;
    const expected = [
      "profiles",
      "chirps",
      "media",
      "follows",
      "likes",
      "notifications",
      "reports",
      "moderation_actions",
      "impressions",
      "topics",
      "user_topics",
      "suggested_accounts",
    ];
    const rows = await sql`
      select tablename from pg_tables
      where schemaname = 'public' and tablename = any(${expected})
    `;
    expect(rows.map((r) => r.tablename).sort()).toEqual(expected.sort());
  });

  it("enables RLS on every table with no policies", async () => {
    if (!sql) return;
    const unprotected = await sql`
      select tablename from pg_tables
      where schemaname = 'public' and not rowsecurity
    `;
    expect(unprotected.map((r) => r.tablename)).toEqual([]);

    const policies = await sql`
      select tablename, policyname from pg_policies where schemaname = 'public'
    `;
    expect(policies).toHaveLength(0);
  });

  it("has the search and feed indexes", async () => {
    if (!sql) return;
    const rows = await sql`
      select indexname from pg_indexes where schemaname = 'public'
    `;
    const names = new Set(rows.map((r) => r.indexname));
    for (const name of [
      "chirps_author_time",
      "chirps_time_top",
      "chirps_replies",
      "chirps_search_trgm",
      "profiles_user_trgm",
      "likes_chirp",
      "follows_followee",
    ]) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it("has the counter trigger functions", async () => {
    if (!sql) return;
    const rows = await sql`
      select proname from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname in (
          'handle_new_user', 'bump_like_count', 'bump_reply_count',
          'bump_follow_counts'
        )
    `;
    expect(rows.map((r) => r.proname).sort()).toEqual(
      ["bump_follow_counts", "bump_like_count", "bump_reply_count", "handle_new_user"],
    );
  });

  it("ships the migration files Supabase will replay", () => {
    const files = readdirSync(join(process.cwd(), "supabase", "migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    expect(files.length).toBeGreaterThanOrEqual(6);
    expect(files[0]).toMatch(/^\d{14}_/);
  });

  it("resets cleanly between tests", async () => {
    if (!sql) return;
    await resetData(sql);
    const [{ count }] = await sql`select count(*)::int as count from profiles`;
    expect(count).toBe(0);
  });
});
