"use server";

import { redirect } from "next/navigation";
import { resolveApprovalSecret, verifyApprovalToken } from "@/lib/approval-token";
import { approvePendingRegistration } from "@/lib/registration-approval";
import { createSupabaseApprovalGateway } from "@/lib/supabase-registration-approval";
import { buildAccountActiveEmail, sendResendEmail } from "@/lib/registration-email";
import { getSiteUrl } from "@/lib/site-url";

export async function approveUserFromEmail(token: string) {
  const verified = verifyApprovalToken(token, resolveApprovalSecret());
  if (!verified.ok) {
    redirect(`/approva-utente?status=${verified.reason}`);
  }
  const result = await approvePendingRegistration({
    userId: verified.userId,
    approvedBy: null,
    siteUrl: getSiteUrl(),
    gateway: createSupabaseApprovalGateway(),
    sendActivationEmail: async ({ email, fullName, appCount, activationUrl }) => {
      await sendResendEmail(buildAccountActiveEmail({
        recipient: email,
        firstName: fullName.trim().split(/\s+/)[0] || "Ciao",
        appCount,
        activationUrl,
      }), {
        apiKey: process.env.RESEND_API_KEY ?? "",
        from: process.env.REGISTRATION_FROM_EMAIL
          || "True Design <accesso@truedesign.app>",
      });
    },
  });
  const status = result.status === "already-approved"
    ? "already-approved"
    : result.emailSent ? "approved" : "approved-email-pending";
  redirect(`/approva-utente?status=${status}`);
}
