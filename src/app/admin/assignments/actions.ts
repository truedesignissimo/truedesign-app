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
import { getApprovalActionResult } from "@/lib/approval-action-result";
import {
  defaultAppIdsForRole,
  type UserRole,
} from "@/lib/user-app-policy";
import { syncUserApps } from "@/lib/user-app-sync";
import { runAdminInvitationTransaction } from "@/lib/admin-invitation-transaction";

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

function createUserAppSyncGateway(admin: ReturnType<typeof createAdminClient>) {
  return {
    async list(userId: string) {
      const { data, error } = await admin
        .from("user_apps")
        .select("app_id")
        .eq("user_id", userId);
      if (error) throw new Error("Impossibile leggere le assegnazioni attuali.");
      return (data ?? []).map((row) => row.app_id);
    },
    async add(userId: string, appIds: string[]) {
      const { error } = await admin.from("user_apps").upsert(
        appIds.map((appId) => ({ user_id: userId, app_id: appId })),
        { onConflict: "user_id,app_id", ignoreDuplicates: true }
      );
      if (error) throw new Error("Impossibile aggiungere le applicazioni.");
    },
    async remove(userId: string, appIds: string[]) {
      const { error } = await admin
        .from("user_apps")
        .delete()
        .eq("user_id", userId)
        .in("app_id", appIds);
      if (error) throw new Error("Impossibile rimuovere le applicazioni.");
    },
  };
}

async function listActiveApps(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("apps")
    .select("id, url")
    .eq("is_active", true);
  if (error) throw new Error("Impossibile leggere il catalogo applicazioni.");
  return data ?? [];
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
    const syncGateway = createUserAppSyncGateway(admin);
    const [{ data: previousProfile, error: previousProfileError }, previousAppIds] =
      await Promise.all([
        existingUser
          ? admin
            .from("profiles")
            .select("full_name, user_type, approval_status, approved_at, approved_by, is_admin")
            .eq("id", existingUser.id)
            .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        existingUser ? syncGateway.list(existingUser.id) : Promise.resolve([]),
      ]);
    if (previousProfileError) {
      return { ok: false as const, error: "Impossibile leggere lo stato attuale dell’utente." };
    }
    const { user: invitedUser, created, activationUrl } = await provisionAdminUser(admin.auth, {
      email: normalizedEmail,
      fullName: normalizedName,
      userType,
      siteUrl: getSiteUrl(),
      existingUser,
    });

    const baseProfilePayload = {
      id: invitedUser.id,
      full_name: normalizedName,
      user_type: userType,
      ...(!alreadyExisted ? { is_admin: false } : {}),
    };
    const activeApps = await listActiveApps(admin);
    const assignedAppIds = defaultAppIdsForRole(userType, activeApps);
    await runAdminInvitationTransaction({
      async prepare() {
        const { error } = await admin.from("profiles").upsert({
          ...baseProfilePayload,
          approval_status: "pending",
          approved_at: null,
          approved_by: null,
        });
        if (error) throw new Error(`Profilo non aggiornato: ${error.message}`);
        await syncUserApps(invitedUser.id, assignedAppIds, syncGateway);
      },
      async approve() {
        const { error } = await admin.from("profiles").update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: currentUser.id,
        }).eq("id", invitedUser.id);
        if (error) throw new Error(`Profilo non approvato: ${error.message}`);
      },
      async send() {
        await sendResendEmail(buildAccountActiveEmail({
          recipient: normalizedEmail,
          firstName: normalizedName.split(/\s+/)[0] || "Ciao",
          appCount: assignedAppIds.length,
          activationUrl,
        }), {
          apiKey: process.env.RESEND_API_KEY ?? "",
          from: process.env.REGISTRATION_FROM_EMAIL
            || "True Design <accesso@truedesign.app>",
        }, fetch, {
          idempotencyKey: `activation-invite/${invitedUser.id}`,
        });
      },
      async rollback() {
        if (created) {
          const { error } = await admin.auth.admin.deleteUser(invitedUser.id, false);
          if (error) throw new Error(error.message);
          return;
        }
        if (previousProfile) {
          const { error } = await admin.from("profiles").upsert({
            id: invitedUser.id,
            ...previousProfile,
          });
          if (error) throw new Error(error.message);
        } else {
          const { error } = await admin.from("profiles").delete().eq("id", invitedUser.id);
          if (error) throw new Error(error.message);
        }
        await syncUserApps(invitedUser.id, previousAppIds, syncGateway);
      },
    });

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
      sendActivationEmail: async ({
        email,
        fullName,
        appCount,
        activationUrl,
        idempotencyKey,
      }) => {
        await sendResendEmail(buildAccountActiveEmail({
          recipient: email,
          firstName: fullName.trim().split(/\s+/)[0] || "Ciao",
          appCount,
          activationUrl,
        }), {
          apiKey: process.env.RESEND_API_KEY ?? "",
          from: process.env.REGISTRATION_FROM_EMAIL
            || "True Design <accesso@truedesign.app>",
        }, fetch, { idempotencyKey });
      },
    });
    revalidatePath("/admin/assignments");
    return getApprovalActionResult(
      result.status === "activation-email-failed"
        ? "activation-email-failed"
        : "approved"
    );
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
  return getApprovalActionResult("rejected");
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

export async function setUserType(userId: string, userType: UserRole) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const gateway = createUserAppSyncGateway(admin);
  const previousAppIds = await gateway.list(userId);
  const activeApps = await listActiveApps(admin);
  const desiredAppIds = defaultAppIdsForRole(userType, activeApps);

  try {
    await syncUserApps(userId, desiredAppIds, gateway);
    const { error } = await admin
      .from("profiles")
      .update({ user_type: userType })
      .eq("id", userId);
    if (error) throw new Error("Impossibile aggiornare il profilo utente.");
  } catch (error) {
    try {
      await syncUserApps(userId, previousAppIds, gateway);
    } catch {
      console.error("[admin/assignments] rollback assegnazioni non riuscito", userId);
    }
    throw error;
  }
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
  return desiredAppIds;
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
      for (const table of ["user_apps", "usage_log", "access_log", "profiles"] as const) {
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
  const { error } = await admin.from("user_apps").upsert(
    { user_id: userId, app_id: appId },
    { onConflict: "user_id,app_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
}

export async function assignAllApps(userId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const activeApps = await listActiveApps(admin);
  const desiredIds = activeApps.map((app) => app.id);
  await syncUserApps(userId, desiredIds, createUserAppSyncGateway(admin));
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
  return desiredIds;
}

export async function excludeAllApps(userId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  await syncUserApps(userId, [], createUserAppSyncGateway(admin));
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
  return [] as string[];
}
