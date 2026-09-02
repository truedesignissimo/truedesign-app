"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  runArchiveAndReset,
  runDeleteArchive,
  runRestoreArchive,
  type SurveyArchiveActionResult,
  type SurveyArchiveGateway,
} from "./archive-service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("session_missing");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) throw new Error("admin_required");
  return { user, admin };
}

function createArchiveGateway(admin: ReturnType<typeof createAdminClient>): SurveyArchiveGateway {
  return {
    async archiveAndReset(actorId) {
      const { data, error } = await admin.rpc("archive_and_reset_iconic_survey", { actor: actorId });
      if (error) throw new Error(error.message);
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.archive_id) throw new Error("archive_result_missing");
      return { archiveId: result.archive_id, count: result.response_count ?? 0 };
    },
    async restore(archiveId, actorId) {
      const { data, error } = await admin.rpc("restore_iconic_survey_archive", {
        target_archive: archiveId,
        actor: actorId,
      });
      if (error) throw new Error(error.message);
      const result = Array.isArray(data) ? data[0] : data;
      return {
        restoredCount: result?.restored_count ?? 0,
        safetyArchiveId: result?.safety_archive_id ?? null,
      };
    },
    async delete(archiveId) {
      const { error } = await admin.rpc("delete_iconic_survey_archive", { target_archive: archiveId });
      if (error) throw new Error(error.message);
    },
  };
}

function actionFailure(error: unknown, operation: string): SurveyArchiveActionResult {
  console.error(`[admin/survey-results] ${operation}`, error instanceof Error ? error.message : error);
  return { ok: false, error: "Operazione non riuscita. Riprova tra poco." };
}

function refreshSurveyPages() {
  revalidatePath("/admin/apps/true-sondaggio-iconici");
  revalidatePath("/admin/apps/true-sondaggio-iconici/archive", "layout");
}

export async function archiveAndResetSurvey(confirmation: string): Promise<SurveyArchiveActionResult> {
  try {
    const { user, admin } = await requireAdmin();
    const result = await runArchiveAndReset(confirmation, user.id, createArchiveGateway(admin));
    if (result.ok) refreshSurveyPages();
    return result;
  } catch (error) {
    return actionFailure(error, "archive-reset");
  }
}

export async function restoreSurveyArchive(
  archiveId: string,
  confirmation: string,
): Promise<SurveyArchiveActionResult> {
  try {
    const { user, admin } = await requireAdmin();
    const result = await runRestoreArchive(archiveId, confirmation, user.id, createArchiveGateway(admin));
    if (result.ok) refreshSurveyPages();
    return result;
  } catch (error) {
    return actionFailure(error, "restore");
  }
}

export async function deleteSurveyArchive(
  archiveId: string,
  confirmation: string,
): Promise<SurveyArchiveActionResult> {
  try {
    const { admin } = await requireAdmin();
    const result = await runDeleteArchive(archiveId, confirmation, createArchiveGateway(admin));
    if (result.ok) refreshSurveyPages();
    return result;
  } catch (error) {
    return actionFailure(error, "delete-archive");
  }
}
