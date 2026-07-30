import { createAdminClient } from "./supabase-admin";
import type { ApprovalGateway } from "./registration-approval";
import { generatePasswordSetupUrl } from "./password-setup-url";

export function createSupabaseApprovalGateway(
  admin = createAdminClient()
): ApprovalGateway {
  return {
    async getAccount(userId) {
      const [{ data: authData, error: authError }, { data: profile, error: profileError }] =
        await Promise.all([
          admin.auth.admin.getUserById(userId),
          admin
            .from("profiles")
            .select("full_name, user_type, approval_status")
            .eq("id", userId)
            .maybeSingle(),
        ]);
      if (authError || profileError || !authData.user?.email || !profile) return null;
      return {
        id: userId,
        email: authData.user.email,
        fullName: profile.full_name || authData.user.email.split("@")[0],
        userType: profile.user_type === "interno" ? "interno" : "cliente",
        status: profile.approval_status,
      };
    },
    async listActiveApps() {
      const { data, error } = await admin
        .from("apps")
        .select("id, url")
        .eq("is_active", true);
      if (error) throw new Error("Impossibile leggere le app attive.");
      return data ?? [];
    },
    async listAssignedAppIds(userId) {
      const { data, error } = await admin.from("user_apps").select("app_id").eq("user_id", userId);
      if (error) throw new Error("Impossibile leggere le assegnazioni.");
      return (data ?? []).map((row) => row.app_id);
    },
    async assignApps(userId, appIds) {
      if (!appIds.length) return;
      const { error } = await admin.from("user_apps").insert(
        appIds.map((appId) => ({ user_id: userId, app_id: appId }))
      );
      if (error) throw new Error("Impossibile creare le assegnazioni.");
    },
    async createPasswordSetupUrl(userId, siteUrl) {
      const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
      if (authError || !authData.user?.email) {
        throw new Error("Account non disponibile per l'attivazione.");
      }
      return generatePasswordSetupUrl(admin.auth, authData.user.email, siteUrl);
    },
    async approveProfile(userId, approvedBy) {
      const { error } = await admin.from("profiles").update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
      }).eq("id", userId);
      if (error) throw new Error("Impossibile approvare il profilo.");
    },
  };
}
