"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireSurveyAdmin } from "./admin-auth";
import {
  runArchiveAndReset,
  runDeleteArchive,
  runDeleteResponse,
  runRestoreArchive,
  type SurveyArchiveActionResult,
  type SurveyArchiveGateway,
} from "./archive-service";

function createArchiveGateway(admin: ReturnType<typeof createAdminClient>): SurveyArchiveGateway {
  return {
    async archiveAndReset(actorId) {
      const { data, error } = await admin.rpc("archive_and_reset_iconic_survey", { actor: actorId });
      if (error) throw new Error(error.message);
      const result = Array.isArray(data) ? data[0] : data;
      if (typeof result?.archive_id !== "string" || !Number.isInteger(result.response_count) || result.response_count <= 0) {
        throw new Error("archive_result_missing");
      }
      return { archiveId: result.archive_id, count: result.response_count };
    },
    async restore(archiveId, actorId) {
      const { data, error } = await admin.rpc("restore_iconic_survey_archive", {
        target_archive: archiveId,
        actor: actorId,
      });
      if (error) throw new Error(error.message);
      const result = Array.isArray(data) ? data[0] : data;
      if (!Number.isInteger(result?.restored_count) || result.restored_count <= 0) {
        throw new Error("restore_result_missing");
      }
      return {
        restoredCount: result.restored_count,
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
  revalidatePath("/admin/apps/true-sondaggio-iconici/export");
  revalidatePath("/admin/apps/true-sondaggio-iconici/archive", "layout");
}

export async function deleteSurveyResponse(
  responseId: string,
  confirmation: string,
): Promise<SurveyArchiveActionResult> {
  try {
    const { admin } = await requireSurveyAdmin();
    const result = await runDeleteResponse(responseId, confirmation, {
      async deleteResponse(id) {
        const { data, error } = await admin
          .from("survey_iconic_responses")
          .delete()
          .eq("id", id)
          .select("id")
          .maybeSingle();
        if (error) throw new Error(error.message);
        return typeof data?.id === "string" && data.id.toLowerCase() === id.toLowerCase();
      },
    });
    if (result.ok) refreshSurveyPages();
    return result;
  } catch (error) {
    return actionFailure(error, "delete-response");
  }
}

export async function archiveAndResetSurvey(confirmation: string): Promise<SurveyArchiveActionResult> {
  try {
    const { user, admin } = await requireSurveyAdmin();
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
    const { user, admin } = await requireSurveyAdmin();
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
    const { admin } = await requireSurveyAdmin();
    const result = await runDeleteArchive(archiveId, confirmation, createArchiveGateway(admin));
    if (result.ok) refreshSurveyPages();
    return result;
  } catch (error) {
    return actionFailure(error, "delete-archive");
  }
}
