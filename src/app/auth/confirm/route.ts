import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeAuthDestination } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase-server";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedType = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const destination = safeAuthDestination(requestUrl.searchParams.get("next"));

  if (!tokenHash || !requestedType || !ALLOWED_OTP_TYPES.has(requestedType)) {
    return NextResponse.redirect(new URL("/login?errore=link-non-valido", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: requestedType,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?errore=link-scaduto", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
