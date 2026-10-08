import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";

// Newer Supabase API keys (sb_publishable_* / sb_secret_*) are opaque strings,
// not bearer JWTs. supabase-js otherwise sends them as `Authorization: Bearer`,
// which the API rejects — strip that header and pass the key via `apikey` only.
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

export function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Browser-side client. @supabase/ssr stores the session in cookies (not
// localStorage) so middleware + server components can read it.
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
  });
}

// Backward-compatible shared singleton for existing `import { supabase }` sites.
export const supabase = createClient();
