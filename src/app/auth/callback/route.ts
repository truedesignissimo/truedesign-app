import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { safeAuthDestination } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = safeAuthDestination(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?errore=link-non-valido", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?errore=link-scaduto", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
