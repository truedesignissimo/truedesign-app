"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";

const DEFAULT_OWNER_EMAIL = "dario.breggie@truedesign.it";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

export async function notifyRegistrationRequest(email: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim().replace(/[\r\n]+/g, " ");
  if (
    !/^\S+@\S+\.\S+$/.test(normalizedEmail) ||
    !normalizedName ||
    normalizedName.length > 120 ||
    normalizedEmail.endsWith("@truedesign.it")
  ) {
    return { notified: false };
  }

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const registeredUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
  if (!registeredUser) return { notified: false };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { notified: false };

  const ownerEmail = process.env.APPROVAL_NOTIFICATION_EMAIL || DEFAULT_OWNER_EMAIL;
  const siteUrl = getSiteUrl();
  const safeName = escapeHtml(normalizedName);
  const safeEmail = escapeHtml(normalizedEmail);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.REGISTRATION_FROM_EMAIL || "True Design Workspace <noreply@truedesign.app>",
      to: [ownerEmail],
      subject: `Nuova richiesta di accesso: ${normalizedName}`,
      html: `<p><strong>${safeName}</strong> (${safeEmail}) ha richiesto l'accesso al workspace.</p><p><a href="${siteUrl}/admin/assignments">Apri il pannello utenti per approvare</a></p>`,
    }),
    cache: "no-store",
  });

  return { notified: response.ok };
}
