import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "./client";

// Server-only admin client built on the Supabase SECRET key (sb_secret_*).
// It bypasses RLS, so NEVER import this into a Client Component and never
// expose SUPABASE_SECRET_KEY to the browser (no NEXT_PUBLIC_ prefix).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  return createSupabaseJsClient<Database>(url, secret, {
    // Opaque sb_secret_* keys are not JWTs — reuse the apikey-only fetch shim.
    global: { fetch: createSupabaseFetch(secret) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
