"use server";

import { redirect } from "next/navigation";
import { verifyApprovalToken } from "@/lib/approval-token";
import { approvePendingRegistration } from "@/lib/registration-approval";
import { createSupabaseApprovalGateway } from "@/lib/supabase-registration-approval";
import { buildAccountActiveEmail, sendResendEmail } from "@/lib/registration-email";
import { getSiteUrl } from "@/lib/site-url";

export async function approveUserFromEmail(token: string) {
  const verified = verifyApprovalToken(token, process.env.APPROVAL_LINK_SECRET ?? "");
  if (!verified.ok) {
    redirect(`/approva-utente?status=${verified.reason}`);
  }
  const result = await approvePendingRegistration({
    userId: verified.userId,
    approvedBy: null,
    gateway: createSupabaseApprovalGateway(),
    sendActivationEmail: async ({ email, fullName, appCount }) => {
      await sendResendEmail(buildAccountActiveEmail({
        recipient: email,
        firstName: fullName.trim().split(/\s+/)[0] || "Ciao",
        appCount,
        loginUrl: `${getSiteUrl()}/login`,
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
