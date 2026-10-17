import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { assertNotProduction } from "@/lib/db/env-guard";
import { hasDatabase } from "@/lib/db/test-helpers";

/**
 * Proves the publishable key cannot read or write any table that has RLS on
 * with no policies. Read-only apart from an insert that must be rejected.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

describe.skipIf(!hasDatabase || !url || !key)("RLS with the publishable key", () => {
  it("reads no rows from any table", async () => {
    if (!url || !key) return;
    assertNotProduction("RLS tests");
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
