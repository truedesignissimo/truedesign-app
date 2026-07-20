import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATTENZIONE: usa la service_role key — bypassa la sicurezza (RLS).
// Da usare SOLO in codice server-side (server actions, route handler), MAI nel browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
