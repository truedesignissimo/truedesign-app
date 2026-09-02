export type ArchiveAndResetResult = {
  archiveId: string;
  count: number;
};

export type RestoreArchiveResult = {
  restoredCount: number;
  safetyArchiveId: string | null;
};

export type SurveyArchiveGateway = {
  archiveAndReset(actorId: string): Promise<ArchiveAndResetResult>;
  restore(archiveId: string, actorId: string): Promise<RestoreArchiveResult>;
  delete(archiveId: string): Promise<void>;
};

export type SurveyArchiveActionResult =
  | ({ ok: true } & Partial<ArchiveAndResetResult & RestoreArchiveResult>)
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function runArchiveAndReset(
  confirmation: string,
  actorId: string,
  gateway: SurveyArchiveGateway,
): Promise<SurveyArchiveActionResult> {
  if (confirmation !== "AZZERA") {
    return { ok: false, error: "Scrivi AZZERA per confermare." };
  }

  return { ok: true, ...(await gateway.archiveAndReset(actorId)) };
}

export async function runRestoreArchive(
  archiveId: string,
  confirmation: string,
  actorId: string,
  gateway: SurveyArchiveGateway,
): Promise<SurveyArchiveActionResult> {
  if (!UUID_PATTERN.test(archiveId)) {
    return { ok: false, error: "Archivio non valido." };
  }
  if (confirmation !== "RIPRISTINA") {
    return { ok: false, error: "Scrivi RIPRISTINA per confermare." };
  }

  return { ok: true, ...(await gateway.restore(archiveId, actorId)) };
}

export async function runDeleteArchive(
  archiveId: string,
  confirmation: string,
  gateway: SurveyArchiveGateway,
): Promise<SurveyArchiveActionResult> {
  if (!UUID_PATTERN.test(archiveId)) {
    return { ok: false, error: "Archivio non valido." };
  }
  if (confirmation !== "ELIMINA") {
    return { ok: false, error: "Scrivi ELIMINA per confermare." };
  }

  await gateway.delete(archiveId);
  return { ok: true };
}
