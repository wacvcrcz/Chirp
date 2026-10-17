import { describe, expect, it } from "vitest";
import {
  detectLang,
  normalizeArabic,
  normalizeForSearch,
} from "@/lib/text/normalize";

describe("normalizeArabic", () => {
  it("folds alef variants to one letter", () => {
    expect(normalizeArabic("أحمد")).toBe("احمد");
    expect(normalizeArabic("إحمد")).toBe("احمد");
    expect(normalizeArabic("آحمد")).toBe("احمد");
    expect(normalizeArabic("ٱحمد")).toBe("احمد");
  });

  it("removes diacritics and tatweel", () => {
    expect(normalizeArabic("مُحَمَّد")).toBe("محمد");
    expect(normalizeArabic("مـــحمد")).toBe("محمد");
    expect(normalizeArabic("قُرْآن")).toBe("قرآن".replace("آ", "ا"));
  });

  it("folds ta marbuta and alef maqsura", () => {
    expect(normalizeArabic("مدرسة")).toBe(normalizeArabic("مدرسه"));
    expect(normalizeArabic("مصطفى")).toBe(normalizeArabic("مصطفي"));
  });

  it("folds Persian and Urdu letter forms", () => {
    expect(normalizeArabic("کتاب")).toBe("كتاب");
    expect(normalizeArabic("ی")).toBe("ي");
  });
});

describe("normalizeForSearch", () => {
  it("makes the three common spellings of Ahmed equal", () => {
    expect(normalizeForSearch("أحمد")).toBe(normalizeForSearch("احمد"));
    expect(normalizeForSearch("إحمد")).toBe(normalizeForSearch("احمد"));
  });

  it("matches school with and without ta marbuta", () => {
    expect(normalizeForSearch("مدرسة")).toBe(normalizeForSearch("مدرسه"));
  });

  it("ignores diacritics and tatweel in queries", () => {
    expect(normalizeForSearch("مُحَمَّد")).toBe("محمد");
    expect(normalizeForSearch("مــحمد")).toBe("محمد");
  });

  it("strips Latin accents, lowercases and collapses spaces", () => {
    expect(normalizeForSearch("  ÉCOLE   Cafè  ")).toBe("ecole cafe");
  });

  it("normalizes compatibility forms", () => {
    expect(normalizeForSearch("Ａｈｍｅｄ")).toBe("ahmed");
  });

  it("keeps Darija in Latin letters readable", () => {
    expect(normalizeForSearch("3lach wach 7mdl")).toBe("3lach wach 7mdl");
  });
});

describe("detectLang", () => {
  it("labels Arabic by script ratio", () => {
    expect(detectLang("كيف حالك اليوم")).toBe("ar");
  });

  it("labels English", () => {
    expect(detectLang("shipping the app shell today")).toBe("en");
  });

  it("labels French when hints appear", () => {
    expect(detectLang("je pars pour la ville avec des amis")).toBe("fr");
  });

  it("treats Arabic-majority mixed text as Arabic", () => {
    expect(detectLang("بديت بالعربية ثم switched")).toBe("ar");
  });

  it("returns other for numbers and punctuation only", () => {
    expect(detectLang("123 #!")).toBe("other");
    expect(detectLang("")).toBe("other");
  });
});
