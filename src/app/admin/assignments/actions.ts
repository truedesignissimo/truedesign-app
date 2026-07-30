"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { getSiteUrl } from "@/lib/site-url";
import { provisionAdminUser } from "./invitation";
import { approvePendingRegistration } from "@/lib/registration-approval";
import { createSupabaseApprovalGateway } from "@/lib/supabase-registration-approval";
import { buildAccountActiveEmail, sendResendEmail } from "@/lib/registration-email";
import { deleteWorkspaceUser } from "@/lib/workspace-user-deletion";
import { generatePasswordSetupUrl } from "@/lib/password-setup-url";

async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autenticato");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) throw new Error("Non autorizzato");

  return user;
}

export async function inviteUser(
  email: string,
  fullName: string,
  userType: "interno" | "cliente"
) {
  try {
    const currentUser = await assertIsAdmin();
    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    if (!normalizedName || normalizedName.length > 120) {
      return { ok: false as const, error: "Inserisci un nome valido." };
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return { ok: false as const, error: "Inserisci un indirizzo email valido." };
    }

    const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) return { ok: false as const, error: "Impossibile verificare gli utenti esistenti." };

    const existingUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    ) ?? null;
    const alreadyExisted = Boolean(existingUser);
    const { user: invitedUser, created, activationUrl } = await provisionAdminUser(admin.auth, {
      email: normalizedEmail,
      fullName: normalizedName,
      userType,
      siteUrl: getSiteUrl(),
      existingUser,
    });

    const profilePayload = {
      id: invitedUser.id,
      full_name: normalizedName,
      user_type: userType,
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: currentUser.id,
      ...(!alreadyExisted ? { is_admin: false } : {}),
    };
    const { error: profileError } = await admin.from("profiles").upsert(profilePayload);
    if (profileError) {
      return { ok: false as const, error: `Profilo non aggiornato: ${profileError.message}` };
    }
    try {
      await sendResendEmail(buildAccountActiveEmail({
        recipient: normalizedEmail,
        firstName: normalizedName.split(/\s+/)[0] || "Ciao",
        appCount: 0,
        activationUrl,
      }), {
        apiKey: process.env.RESEND_API_KEY ?? "",
        from: process.env.REGISTRATION_FROM_EMAIL
          || "True Design <accesso@truedesign.app>",
      });
    } catch (error) {
      if (created) await admin.auth.admin.deleteUser(invitedUser.id, false);
      throw error;
    }

    revalidatePath("/admin/assignments");
    return {
      ok: true as const,
      message: alreadyExisted
        ? "Account aggiornato. È stata inviata una nuova email per scegliere la password."
        : "Utente creato. Riceverà via email il link per scegliere la password.",
    };
  } catch (error) {
    console.error("[admin/assignments] invite", error instanceof Error ? error.message : error);
    return {
      ok: false as const,
      error: error instanceof Error
        ? error.message
        : "Non è stato possibile creare l’utente e inviare l’email.",
    };
  }
}

export async function setUserApproval(userId: string, approved: boolean) {
  const currentUser = await assertIsAdmin();
  const admin = createAdminClient();

  if (approved) {
    const result = await approvePendingRegistration({
      userId,
      approvedBy: currentUser.id,
      siteUrl: getSiteUrl(),
      gateway: createSupabaseApprovalGateway(admin),
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
    revalidatePath("/admin/assignments");
    return {
      message: result.emailSent
        ? "Utente approvato, app assegnate e conferma inviata."
        : "Utente approvato e app assegnate; conferma email da reinviare.",
    };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      approval_status: approved ? "approved" : "rejected",
      approved_at: approved ? new Date().toISOString() : null,
      approved_by: approved ? currentUser.id : null,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
  return {
    message: "Accesso sospeso.",
  };
}

export async function resendActivationEmail(userId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const [{ data: authData, error: authError }, { data: profile }, { count, error: countError }] =
    await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("profiles").select("full_name, approval_status").eq("id", userId).maybeSingle(),
      admin.from("user_apps").select("app_id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
  if (
    authError ||
    countError ||
    !authData.user?.email ||
    profile?.approval_status !== "approved"
  ) {
    throw new Error("Account approvato non disponibile.");
  }
  const fullName = profile.full_name || authData.user.email;
  const activationUrl = await createSupabaseApprovalGateway(admin)
    .createPasswordSetupUrl(userId, getSiteUrl());
  await sendResendEmail(buildAccountActiveEmail({
    recipient: authData.user.email,
    firstName: fullName.trim().split(/\s+/)[0] || "Ciao",
    appCount: count ?? 0,
    activationUrl,
  }), {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.REGISTRATION_FROM_EMAIL || "True Design <accesso@truedesign.app>",
  });
  return { message: `Conferma account reinviata a ${authData.user.email}.` };
}

export async function toggleUserAdmin(userId: string, isAdmin: boolean) {
  const currentUser = await assertIsAdmin();
  if (currentUser.id === userId && !isAdmin) {
    throw new Error("Non puoi rimuovere il ruolo amministratore dal tuo account.");
  }
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function setUserType(userId: string, userType: "interno" | "cliente") {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ user_type: userType }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function updateUserName(userId: string, fullName: string) {
  await assertIsAdmin();
  const normalizedName = fullName.trim();
  if (!normalizedName) throw new Error("Il nome non può essere vuoto.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: normalizedName })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function sendPasswordReset(email: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const activationUrl = await generatePasswordSetupUrl(
    admin.auth,
    email,
    getSiteUrl()
  );
  await sendResendEmail(buildAccountActiveEmail({
    recipient: email,
    firstName: email.split("@")[0] || "Ciao",
    appCount: 0,
    activationUrl,
  }), {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.REGISTRATION_FROM_EMAIL
      || "True Design <accesso@truedesign.app>",
  });
}

export async function deleteUser(userId: string) {
  const currentUser = await assertIsAdmin();
  if (currentUser.id === userId) {
    throw new Error("Non puoi eliminare il tuo account mentre lo stai utilizzando.");
  }

  const admin = createAdminClient();
  await deleteWorkspaceUser(userId, {
    async deleteAuthUser(id) {
      const { error } = await admin.auth.admin.deleteUser(id, false);
      if (error) throw new Error(`Eliminazione Auth non riuscita: ${error.message}`);
    },
    async authUserExists(id) {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (!error) return Boolean(data.user);
      if (error.status === 404 || /not found/i.test(error.message)) return false;
      throw new Error(`Verifica eliminazione non riuscita: ${error.message}`);
    },
    async deleteResidualData(id) {
      for (const table of ["user_apps", "usage_log", "profiles"] as const) {
        const column = table === "profiles" ? "id" : "user_id";
        const { error } = await admin.from(table).delete().eq(column, id);
        if (error) throw new Error(`Pulizia dati ${table} non riuscita: ${error.message}`);
      }
    },
  });
  revalidatePath("/admin/assignments");
}

export async function assignApp(userId: string, appId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("user_apps").insert({ user_id: userId, app_id: appId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function unassignApp(userId: string, appId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_apps")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}
