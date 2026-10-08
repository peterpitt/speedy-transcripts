import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "./client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Server-side client for Server Components, Route Handlers and middleware.
// cookies() is async in Next.js 15+ — callers MUST await this function.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In a Server Component the cookie store is read-only; the try/catch
        // lets those renders no-op while middleware/route handlers still write.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  });
}
