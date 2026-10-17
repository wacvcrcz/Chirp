/**
 * Format numbers with Western digits in every locale: the Intl locale carries
 * the -u-nu-latn extension, per the project rules.
 */
export function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
