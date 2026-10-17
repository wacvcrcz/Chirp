import { describe, expect, it } from "vitest";
import { isLocalDatabaseUrl } from "@/lib/db/url";

/**
 * The seed guard is the only thing standing between a typo and a real
 * database, so it is tested directly rather than through the script.
 */
describe("seed database guard", () => {
  it("accepts local hosts", () => {
    expect(isLocalDatabaseUrl("postgresql://postgres:postgres@localhost:54322/postgres")).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://postgres:postgres@127.0.0.1:54322/postgres")).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://postgres:postgres@[::1]:54322/postgres")).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://postgres:postgres@LOCALHOST:54322/postgres")).toBe(true);
  });

  it("rejects hosted projects, including pooler hosts", () => {
    expect(isLocalDatabaseUrl("postgresql://u:p@db.abcdefghijkl.supabase.co:5432/postgres")).toBe(false);
    expect(
      isLocalDatabaseUrl("postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"),
    ).toBe(false);
    expect(isLocalDatabaseUrl("postgresql://u:p@10.0.0.5:5432/postgres")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isLocalDatabaseUrl("not a url")).toBe(false);
    expect(isLocalDatabaseUrl("")).toBe(false);
  });
});
