"use server";

import { buildPasswordRecoveryEmail, sendResendEmail } from "@/lib/registration-email";
import { generatePasswordSetupUrl } from "@/lib/password-setup-url";
import { requestPasswordRecovery } from "@/lib/password-recovery";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase-admin";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
};

function firstName(fullName: string | null | undefined, email: string) {
  return fullName?.trim().split(/\s+/)[0] || email.split("@")[0] || "Ciao";
}

export async function requestPasswordRecoveryFromEmail(email: string) {
  const admin = createAdminClient();

  try {
    return await requestPasswordRecovery(email, {
      async findActiveAccount(normalizedEmail) {
        const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (usersError) throw usersError;

        const user = (usersData.users as AuthUser[]).find(
          (candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail
        );
        if (!user?.email) return null;

        const { data: profile, error: profileError } = await admin
          .from("profiles")
          .select("full_name, approval_status")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (profile?.approval_status !== "approved") return null;

        return {
          email: user.email,
          firstName: firstName(profile.full_name, user.email),
        };
      },
      async createRecoveryUrl(activeEmail) {
        return generatePasswordSetupUrl(admin.auth, activeEmail, getSiteUrl());
      },
      async sendRecoveryEmail(input) {
        await sendResendEmail(buildPasswordRecoveryEmail({
          recipient: input.email,
          firstName: input.firstName,
          recoveryUrl: input.recoveryUrl,
        }), {
          apiKey: process.env.RESEND_API_KEY ?? "",
          from: process.env.REGISTRATION_FROM_EMAIL
            || "True Design <accesso@truedesign.app>",
        });
      },
    });
  } catch (error) {
    console.error("[password-recovery] richiesta non completata", error);
    return { ok: true as const };
  }
}
