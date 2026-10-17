/**
 * Environment guard shared by scripts and database tests. Values are never
 * printed; only the derived project ref is compared.
 */

/**
 * Reads the Supabase project ref from either the API URL or the pooled
 * DATABASE_URL (user name `postgres.<ref>`). Returns null when unreadable.
 */
export function projectRefFromUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, "");

    if (host.endsWith(".supabase.co")) {
      return host.split(".")[0] ?? null;
    }

    const match = /^postgres\.([a-z0-9]{20})$/.exec(decodeURIComponent(url.username));
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function currentProjectRef(): string | null {
  return (
    projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    projectRefFromUrl(process.env.DATABASE_URL)
  );
}

/**
 * Refuses to continue when the target project is the production project.
 * When PRODUCTION_PROJECT_REF is unset the ref cannot match, so the command
 * proceeds with a warning; set it as soon as a production project exists.
 */
export function assertNotProduction(operation: string): void {
  const ref = currentProjectRef();
  const production = process.env.PRODUCTION_PROJECT_REF?.trim();

  if (!ref) {
    throw new Error(
      `${operation}: could not determine the project ref from NEXT_PUBLIC_SUPABASE_URL or DATABASE_URL.`,
    );
  }
  if (!production) {
    console.warn(
      `${operation}: PRODUCTION_PROJECT_REF is not set; skipping the production guard.`,
    );
    return;
  }
  if (ref === production) {
    throw new Error(
      `${operation}: refusing to run against the production project (${ref}).`,
    );
  }
}
