"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";
import { resolveApprovalSecret } from "@/lib/approval-token";
import { buildApprovalUrl } from "@/lib/registration-approval-links";
import { buildAdminApprovalEmail, sendResendEmail } from "@/lib/registration-email";
import {
  submitRegistrationRequest,
  type RegistrationIdentity,
  type RegistrationRequestGateway,
} from "@/lib/registration-request";
import { revalidatePath } from "next/cache";

const DEFAULT_OWNER_EMAIL = "dario.breggie@truedesign.it";

async function notifyRegistrationRequest(userId: string, identity: RegistrationIdentity) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Configurazione Resend assente.");
  const secret = resolveApprovalSecret();

  const ownerEmail = process.env.APPROVAL_NOTIFICATION_EMAIL || DEFAULT_OWNER_EMAIL;
  const siteUrl = getSiteUrl();
  await sendResendEmail(buildAdminApprovalEmail({
    recipient: ownerEmail,
    fullName: identity.fullName,
    email: identity.email,
    approvalUrl: buildApprovalUrl(userId, secret, siteUrl),
  }), {
    apiKey,
    from: process.env.REGISTRATION_FROM_EMAIL || "True Design <accesso@truedesign.app>",
  });
}

export async function registerPendingUser(input: {
  firstName: string;
  lastName: string;
  email: string;
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
  const admin = createAdminClient();
  const userType = email.endsWith("@truedesign.it") ? "interno" : "cliente";
  const identity = { firstName, lastName, fullName, email };
  const profilePayload = {
    full_name: fullName,
    user_type: userType,
    approval_status: "pending" as const,
    approved_at: null,
    approved_by: null,
  };

  const gateway: RegistrationRequestGateway = {
    async findByEmail(candidateEmail) {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw new Error("Impossibile verificare gli account esistenti.");
      const authUser = data.users.find(
        (user) => user.email?.toLowerCase() === candidateEmail
      );
      if (!authUser) return null;
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("approval_status")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profileError) throw new Error("Impossibile verificare il profilo.");
      return {
        id: authUser.id,
        status: profile?.approval_status ?? "pending",
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        hasSignedIn: Boolean(authUser.last_sign_in_at),
      };
    },
    async createPendingAccount(accountIdentity) {
      const { data, error } = await admin.auth.admin.createUser({
        email: accountIdentity.email,
        password: randomBytes(32).toString("base64url"),
        email_confirm: false,
        user_metadata: {
          full_name: accountIdentity.fullName,
          first_name: accountIdentity.firstName,
          last_name: accountIdentity.lastName,
        },
      });
      if (error || !data.user) {
        throw new Error("Non è stato possibile creare l'account.");
      }
      const { error: profileError } = await admin.from("profiles").upsert({
        id: data.user.id,
        is_admin: false,
        ...profilePayload,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id, false);
        throw new Error("Non è stato possibile preparare il profilo.");
      }
      return data.user.id;
    },
    async refreshPendingAccount(userId, accountIdentity) {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: accountIdentity.fullName,
          first_name: accountIdentity.firstName,
          last_name: accountIdentity.lastName,
        },
      });
      if (authError) throw new Error("Non è stato possibile aggiornare l'account.");
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        ...profilePayload,
      });
      if (profileError) throw new Error("Non è stato possibile aggiornare il profilo.");
    },
    notifyOwner: notifyRegistrationRequest,
  };

  try {
    const result = await submitRegistrationRequest(identity, gateway);
    revalidatePath("/admin/assignments");

    if (result.status === "already-active") {
      return {
        ok: false as const,
        status: result.status,
        error: "Questo account è già attivo. Accedi oppure recupera la password.",
      };
    }
    if (result.status === "notification-failed") {
      console.error("[registration] owner_notification_failed");
      return {
        ok: false as const,
        status: result.status,
        error: "La richiesta è stata salvata, ma la notifica non è partita. Riprova tra poco.",
      };
    }
    return { ok: true as const, status: result.status };
  } catch (error) {
    console.error("[registration] request_failed", error instanceof Error ? error.message : "unknown");
    return {
      ok: false as const,
      status: "failed" as const,
      error: "Non è stato possibile completare la registrazione. Riprova tra poco.",
    };
  }
}
