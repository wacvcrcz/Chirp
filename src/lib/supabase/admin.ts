/**
 * Server-only Supabase admin client. Uses the secret key, which must never
 * reach the browser or a NEXT_PUBLIC_ variable.
 */
import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("The admin client must never be imported in the browser.");
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for the admin client.",
    );
  }

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
