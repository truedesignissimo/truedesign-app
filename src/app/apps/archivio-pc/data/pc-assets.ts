import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { EDIT_FIELDS, toPcRecord, type PcRow } from "../domain/editor";

export async function getPcAdministrator() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error } = await createAdminClient()
    .from("profiles").select("is_admin, approval_status").eq("id", user.id).maybeSingle();
  return !error && profile?.is_admin === true && profile.approval_status === "approved" ? user.id : null;
}

export async function loadPcAssets(canEdit: boolean) {
  const columns = ["id", "updated_on", ...EDIT_FIELDS.map(([key]) => key)];
  if (canEdit) columns.push("updated_at");
  const db = createAdminClient();
  const rows: PcRow[] = [];
  const batchSize = 500;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await db.from("pc_assets").select(columns.join(","))
      .eq("is_archived", false).order("id").range(offset, offset + batchSize - 1)
      .overrideTypes<PcRow[], { merge: false }>();
    if (error) throw error;
    rows.push(...data);
    if (data.length < batchSize) break;
  }
  return {
    pcs: rows.map(toPcRecord),
    versions: canEdit ? Object.fromEntries(rows.map((row) => [row.id, row.updated_at])) : undefined,
  };
}
