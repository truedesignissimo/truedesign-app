"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autenticato");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Non autorizzato");

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

    const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) return { ok: false as const, error: "Impossibile verificare gli utenti esistenti." };

    let invitedUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );
    let alreadyExisted = Boolean(invitedUser);

    if (!invitedUser) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: normalizedName, user_type: userType },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.truedesign.app"}/login`,
      });
      if (error || !data.user) {
        return {
          ok: false as const,
          error: error?.message || "Il servizio email non ha accettato l’invito.",
        };
      }
      invitedUser = data.user;
      alreadyExisted = false;
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: invitedUser.id,
      full_name: normalizedName,
      user_type: userType,
      is_admin: false,
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: currentUser.id,
    });
    if (profileError) {
      return { ok: false as const, error: `Profilo non aggiornato: ${profileError.message}` };
    }

    revalidatePath("/admin/assignments");
    return {
      ok: true as const,
      message: alreadyExisted
        ? "L’account esisteva già: profilo approvato e aggiornato."
        : "Invito inviato via email e profilo approvato.",
    };
  } catch {
    return { ok: false as const, error: "Sessione non valida o permessi amministratore mancanti." };
  }
}

export async function setUserApproval(userId: string, approved: boolean) {
  const currentUser = await assertIsAdmin();
  const admin = createAdminClient();
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
  const { error } = await admin.auth.resetPasswordForEmail(email);
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
