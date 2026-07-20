"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export type AppInput = {
  name: string;
  description: string | null;
  url: string | null;
  visibility: string;
  is_featured?: boolean;
  display_order?: number;
};

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

function normalizeApp(input: AppInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Il nome dell’app è obbligatorio.");

  return {
    name,
    description: input.description?.trim() || null,
    url: input.url?.trim() || null,
    visibility: input.visibility,
    ...(typeof input.is_featured === "boolean" ? { is_featured: input.is_featured } : {}),
    ...(typeof input.display_order === "number"
      ? { display_order: Math.max(0, input.display_order) }
      : {}),
  };
}

function revalidateCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/apps");
  revalidatePath("/dashboard");
  revalidatePath("/pubblico");
}

export async function createAppRecord(input: AppInput) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("apps").insert(normalizeApp(input));
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function updateAppRecord(appId: string, input: AppInput) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("apps").update(normalizeApp(input)).eq("id", appId);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function setAppActive(appId: string, isActive: boolean) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("apps").update({ is_active: isActive }).eq("id", appId);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function deleteAppRecord(appId: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("apps").delete().eq("id", appId);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}
