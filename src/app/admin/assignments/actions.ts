"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { getAuthRedirect } from "@/lib/site-url";
import { provisionAdminUser } from "./invitation";

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
    const { user: invitedUser } = await provisionAdminUser(admin.auth, {
      email: normalizedEmail,
      fullName: normalizedName,
      userType,
      redirectTo: getAuthRedirect("/imposta-password"),
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
    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(userId);
    const email = userResult.user?.email;
    if (userError || !email) throw new Error("Indirizzo email dell’utente non disponibile.");

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("full_name, user_type")
      .eq("id", userId)
      .maybeSingle();

    await provisionAdminUser(admin.auth, {
      email,
      fullName: existingProfile?.full_name || email.split("@")[0],
      userType: existingProfile?.user_type === "interno" ? "interno" : "cliente",
      redirectTo: getAuthRedirect("/imposta-password"),
      existingUser: userResult.user,
    });
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
    message: approved
      ? "Utente approvato: email inviata per scegliere la password e accedere."
      : "Accesso sospeso.",
  };
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
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirect("/imposta-password"),
  });
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId: string) {
  const currentUser = await assertIsAdmin();
  if (currentUser.id === userId) {
    throw new Error("Non puoi eliminare il tuo account mentre lo stai utilizzando.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
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
