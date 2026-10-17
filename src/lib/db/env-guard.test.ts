import { afterEach, describe, expect, it, vi } from "vitest";
import { assertNotProduction, projectRefFromUrl } from "@/lib/db/env-guard";

const REF = "abcdefghijklmnopqrst";

describe("projectRefFromUrl", () => {
  it("reads the ref from the API URL", () => {
    expect(projectRefFromUrl(`https://${REF}.supabase.co`)).toBe(REF);
  });

  it("reads the ref from a pooled database URL", () => {
    expect(
      projectRefFromUrl(
        `postgresql://postgres.${REF}:pw@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
      ),
    ).toBe(REF);
  });

  it("returns null for local and malformed values", () => {
    expect(projectRefFromUrl("postgresql://postgres:postgres@127.0.0.1:5432/postgres")).toBeNull();
    expect(projectRefFromUrl("not a url")).toBeNull();
    expect(projectRefFromUrl(undefined)).toBeNull();
  });
});

describe("assertNotProduction", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    vi.restoreAllMocks();
  });

  function setTarget(ref: string) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${ref}.supabase.co`;
  }

  it("refuses when the project ref equals PRODUCTION_PROJECT_REF", () => {
    setTarget(REF);
    process.env.PRODUCTION_PROJECT_REF = REF;
    expect(() => assertNotProduction("test")).toThrow(/production project/);
  });

  it("allows a different project", () => {
    setTarget(REF);
    process.env.PRODUCTION_PROJECT_REF = "zzzzzzzzzzzzzzzzzzzz";
    expect(() => assertNotProduction("test")).not.toThrow();
  });

  it("warns and proceeds when PRODUCTION_PROJECT_REF is unset", () => {
    setTarget(REF);
    delete process.env.PRODUCTION_PROJECT_REF;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertNotProduction("test")).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("throws when the ref cannot be determined", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.PRODUCTION_PROJECT_REF;
    expect(() => assertNotProduction("test")).toThrow(/could not determine/);
  });
});
