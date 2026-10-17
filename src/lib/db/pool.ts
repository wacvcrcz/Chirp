/**
 * postgres.js pool sizing. Serverless functions get one connection; scripts
 * that run many statements get more. Override with DB_POOL_SIZE.
 */
export function poolSize(fallback = 1): number {
  const raw = process.env.DB_POOL_SIZE;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}
