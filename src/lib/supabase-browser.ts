import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseCookieOptions } from "./supabase-cookie-options";

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Durante il prerender locale i componenti client possono essere valutati
  // sul server, ma non devono aprire una connessione Supabase. In browser
  // conserviamo invece un errore esplicito se Vercel non avesse le variabili.
  if (!url || !anonKey) {
    if (typeof window === "undefined") return {} as SupabaseClient;
    throw new Error("Configurazione Supabase mancante: controlla le variabili pubbliche di Vercel.");
  }
  return createBrowserClient(
    url,
    anonKey,
    { cookieOptions: supabaseCookieOptions }
  );
}
