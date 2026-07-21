"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";

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

async function notifyRegistrationRequest(email: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim().replace(/[\r\n]+/g, " ");
  if (
    !/^\S+@\S+\.\S+$/.test(normalizedEmail) ||
    !normalizedName ||
    normalizedName.length > 120
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
      from: process.env.REGISTRATION_FROM_EMAIL || "True Design <accesso@truedesign.app>",
      to: [ownerEmail],
      subject: `Nuova richiesta di accesso: ${normalizedName}`,
      html: `<p><strong>${safeName}</strong> (${safeEmail}) ha richiesto l'accesso al workspace.</p><p><a href="${siteUrl}/admin/assignments">Apri il pannello utenti per approvare</a></p>`,
    }),
    cache: "no-store",
  });

  return { notified: response.ok };
}

export async function registerPendingUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const firstName = input.firstName.trim().replace(/[\r\n]+/g, " ");
  const lastName = input.lastName.trim().replace(/[\r\n]+/g, " ");
  const fullName = `${firstName} ${lastName}`.trim();
  const email = input.email.trim().toLowerCase();

  if (!firstName || !lastName || fullName.length > 120) {
    return { ok: false as const, error: "Inserisci nome e cognome validi." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false as const, error: "Inserisci un indirizzo email valido." };
  }
  if (input.password.length < 8 || input.password.length > 128) {
    return { ok: false as const, error: "La password deve contenere almeno 8 caratteri." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error || !data.user) {
    const alreadyExists = /already|registered|exists/i.test(error?.message ?? "");
    return {
      ok: false as const,
      error: alreadyExists
        ? "Esiste già un account con questo indirizzo email."
        : "Non è stato possibile completare la registrazione. Riprova tra poco.",
    };
  }

  const userType = email.endsWith("@truedesign.it") ? "interno" : "cliente";
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    user_type: userType,
    is_admin: false,
    approval_status: "pending",
    approved_at: null,
    approved_by: null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false as const, error: "Non è stato possibile preparare il profilo." };
  }

  try {
    await notifyRegistrationRequest(email, fullName);
  } catch {
    // Il profilo resta comunque visibile nel pannello amministratore.
  }

  revalidatePath("/admin/assignments");
  return { ok: true as const };
}
