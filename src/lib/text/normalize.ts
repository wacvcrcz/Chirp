const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g; // tashkeel and Quranic marks
const TATWEEL = /ـ/g;

export function normalizeArabic(s: string): string {
  return s
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ک/g, "ك") // Persian/Urdu kaf
    .replace(/ی/g, "ي"); // Persian/Urdu yeh
}

/**
 * The copy stored in chirps.body_search and the form applied to every query.
 * Arabic variants, diacritics, tatweel, Latin accents and whitespace all fold
 * to one shape so أحمد, احمد and إحمد match each other.
 */
export function normalizeForSearch(s: string): string {
  return normalizeArabic(s.normalize("NFKC"))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip Latin accents
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stage-1 heuristic: script ratio plus a few French hints. Good enough to
 * label chirps and to pick the For you language boost.
 */
export function detectLang(s: string): "ar" | "en" | "fr" | "other" {
  const ar = (s.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  if (ar + latin < 3) return "other";
  if (ar > latin) return "ar";
  return /[éèêàçùâîôû]|\b(le|la|les|des|est|pour|avec)\b/i.test(s)
    ? "fr"
    : "en";
}
