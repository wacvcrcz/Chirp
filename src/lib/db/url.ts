/**
 * The one rule that decides whether a database URL may be written to.
 * `db:seed` uses it; the test suite covers it directly.
 */
export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"] as const;

export function isLocalDatabaseUrl(value: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return false;
  }
  // URL keeps IPv6 brackets: "[::1]" -> "::1".
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (LOCAL_HOSTS as readonly string[]).includes(host);
}
