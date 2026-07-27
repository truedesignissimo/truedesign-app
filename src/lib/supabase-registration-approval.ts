import { createAdminClient } from "./supabase-admin";
import type { ApprovalGateway } from "./registration-approval";

export function createSupabaseApprovalGateway(
  admin = createAdminClient()
): ApprovalGateway {
  return {
    async getAccount(userId) {
      const [{ data: authData, error: authError }, { data: profile, error: profileError }] =
        await Promise.all([
          admin.auth.admin.getUserById(userId),
          admin.from("profiles").select("full_name, approval_status").eq("id", userId).maybeSingle(),
        ]);
      if (authError || profileError || !authData.user?.email || !profile) return null;
      return {
        id: userId,
        email: authData.user.email,
        fullName: profile.full_name || authData.user.email.split("@")[0],
        status: profile.approval_status,
      };
    },
    async listActiveAppIds() {
      const { data, error } = await admin.from("apps").select("id").eq("is_active", true);
      if (error) throw new Error("Impossibile leggere le app attive.");
      return (data ?? []).map((app) => app.id);
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
    async createPasswordSetupUrl(userId, redirectTo) {
      const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
      if (authError || !authData.user?.email) {
        throw new Error("Account non disponibile per l'attivazione.");
      }
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: authData.user.email,
        options: { redirectTo },
      });
      const actionLink = data?.properties?.action_link;
      if (error || !actionLink) {
        throw new Error("Impossibile generare il link di attivazione.");
      }
      return actionLink;
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
