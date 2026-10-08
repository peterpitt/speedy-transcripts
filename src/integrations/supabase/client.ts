// Kept for backward compatibility with existing `@/integrations/supabase/client`
// imports. The real browser client now lives in `@/lib/supabase/client`
// (built on @supabase/ssr for cookie-based sessions).
export { supabase, createClient, createSupabaseFetch } from "@/lib/supabase/client";
export type { Database } from "./types";
