const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const URL_RE = /https?:\/\/[^\s]+/g;
export const LINK_LENGTH = 23;

/**
 * The composer and the API share this count: graphemes plus 23 per link, so a
 * long URL never pushes a chirp over the limit by itself.
 */
export function countChars(text: string): number {
  const withoutLinks = text.replace(URL_RE, "");
  const links = (text.match(URL_RE) ?? []).length;
  let n = 0;
  // Iterating the segmenter yields one item per user-perceived character.
  Array.from(seg.segment(withoutLinks)).forEach(() => n++);
  return n + links * LINK_LENGTH;
}
