import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Proves the publishable (anon) key cannot read tables that have RLS on with no
 * policies. Requires Supabase local running with the key exported. This is the
 * automated half; AGENTS.md also documents the manual check for a hosted
 * project, where the server connection is the only writer.
 */
const url = process.env.TEST_SUPABASE_URL;
const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY;

const TABLES = [
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
] as const;

describe.skipIf(!url || !key)("RLS with the publishable key", () => {
  it("reads no rows from any table", async () => {
    if (!url || !key) return;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*").limit(1);

      if (data && data.length > 0) {
        throw new Error(`${table} is readable with the publishable key.`);
      }
      // Either an error or an empty result is acceptable; rows are not.
      expect(data ?? []).toHaveLength(0);
      if (error) expect(error.code).toBeTruthy();
    }
  });

  it("cannot insert", async () => {
    if (!url || !key) return;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from("topics")
      .insert({ slug: "rls_probe", name_en: "Probe", name_ar: "اختبار" });
    expect(error).not.toBeNull();
  });
});
