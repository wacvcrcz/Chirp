import { describe, expect, it } from "vitest";
import { countChars, LINK_LENGTH } from "@/lib/text/count";

describe("countChars", () => {
  it("counts ASCII text by character", () => {
    expect(countChars("hello")).toBe(5);
  });

  it("counts Arabic letters individually", () => {
    expect(countChars("مرحبا")).toBe(5);
  });

  it("treats an emoji as one grapheme", () => {
    expect(countChars("👋")).toBe(1);
    expect(countChars("👨‍👩‍👧‍👦")).toBe(1);
  });

  it("counts a flag as one grapheme", () => {
    expect(countChars("🇲🇦")).toBe(1);
  });

  it("counts combining marks with their base letter", () => {
    expect(countChars("é")).toBe(1);
  });

  it("counts each link as 23 regardless of URL length", () => {
    const long = "https://example.com/a-very-long-path/that/goes/on";
    expect(countChars(long)).toBe(LINK_LENGTH);
    expect(countChars(`see ${long} now`)).toBe(4 + LINK_LENGTH + 4);
  });

  it("counts multiple links separately", () => {
    expect(countChars("https://a.co https://b.co")).toBe(LINK_LENGTH * 2 + 1);
  });

  it("returns 0 for empty input", () => {
    expect(countChars("")).toBe(0);
  });

  it("keeps the default limit meaningful for Arabic with diacritics", () => {
    expect(countChars("مُحَمَّد")).toBe(4);
  });
});
