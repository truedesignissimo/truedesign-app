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
}

export async function inviteUser(email: string, fullName: string) {
  await assertIsAdmin();

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/assignments");
  return data;
}

export async function listUsersWithProfiles() {
  await assertIsAdmin();

  const admin = createAdminClient();
  const { data: usersData, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, is_admin, user_type");

  return usersData.users.map((u) => {
    const profile = profiles?.find((p) => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name ?? null,
      is_admin: profile?.is_admin ?? false,
      user_type: profile?.user_type ?? "cliente",
    };
  });
}

export async function toggleUserAdmin(userId: string, isAdmin: boolean) {
  await assertIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function setUserType(userId: string, userType: "interno" | "cliente") {
  await assertIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ user_type: userType }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function assignApp(userId: string, appId: string) {
  await assertIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("user_apps").insert({ user_id: userId, app_id: appId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}

export async function unassignApp(userId: string, appId: string) {
  await assertIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_apps")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/assignments");
}
