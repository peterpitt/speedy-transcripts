import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Newer Supabase API keys (sb_publishable_* / sb_secret_*) are opaque strings,
// not bearer JWTs. supabase-js otherwise sends them as `Authorization: Bearer`,
// which the API rejects — strip that header and pass the key via `apikey` only.
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    ...(!SUPABASE_URL ? ["VITE_SUPABASE_URL"] : []),
    ...(!SUPABASE_PUBLISHABLE_KEY ? ["VITE_SUPABASE_PUBLISHABLE_KEY"] : []),
  ];
  throw new Error(
    `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
      `Set them in your .env file and in your Vercel project settings.`,
  );
}

// Single shared browser Supabase client for the whole app.
// Import it with: import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
