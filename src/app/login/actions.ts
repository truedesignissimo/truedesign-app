"use server";

import {
  recordAuthenticatedAccess,
  type AccessSource,
} from "@/lib/access-log";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function recordWorkspaceAccess(source: AccessSource) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const result = await recordAuthenticatedAccess(source, {
    async getAuthenticatedUserId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    async insert(userId, accessSource) {
      const { error } = await admin.from("access_log").insert({
        user_id: userId,
        source: accessSource,
      });
      if (error) throw new Error(error.message);
    },
  });

  if (!result.ok) {
    console.error("[access] Login non registrato:", result.error);
  }
  return result;
}
