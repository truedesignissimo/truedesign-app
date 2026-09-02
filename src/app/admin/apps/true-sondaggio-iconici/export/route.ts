import { createSurveyWorkbook } from "../workbook";
import { requireSurveyAdmin } from "../admin-auth";
import type { SurveyResponse } from "../survey-results";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 1000;

async function loadResponses(
  admin: Awaited<ReturnType<typeof requireSurveyAdmin>>["admin"],
  archiveId: string | null,
) {
  const responses: SurveyResponse[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = admin
      .from(archiveId ? "survey_iconic_archive_responses" : "survey_iconic_responses")
      .select("id, participant_name, choices, submitted_at")
      .order("submitted_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (archiveId) query = query.eq("archive_id", archiveId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    responses.push(...((data ?? []) as SurveyResponse[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return responses;
}

function exportFilename(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Rome",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "00";
  return `sondaggio-prodotti-iconici-${part("year")}-${part("month")}-${part("day")}-${part("hour")}${part("minute")}.xlsx`;
}

export async function GET(request: Request) {
  try {
    const { admin } = await requireSurveyAdmin();
    const archiveId = new URL(request.url).searchParams.get("archive");
    if (archiveId && !UUID_PATTERN.test(archiveId)) {
      return Response.json({ ok: false, error: "Archivio non valido." }, { status: 400 });
    }

    let referenceDate = new Date();
    if (archiveId) {
      const { data, error } = await admin
        .from("survey_iconic_archives")
        .select("archived_at")
        .eq("id", archiveId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return Response.json({ ok: false, error: "Archivio non trovato." }, { status: 404 });
      referenceDate = new Date(data.archived_at);
    }

    const responses = await loadResponses(admin, archiveId);
    if (responses.length === 0) {
      return Response.json({ ok: false, error: "Nessun risultato da esportare." }, { status: 404 });
    }

    const workbook = createSurveyWorkbook(responses);
    const responseBody = new ArrayBuffer(workbook.byteLength);
    new Uint8Array(responseBody).set(workbook);
    return new Response(responseBody, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportFilename(referenceDate)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "session_missing") {
      return Response.json({ ok: false }, { status: 401 });
    }
    if (message === "admin_required") {
      return Response.json({ ok: false }, { status: 403 });
    }
    console.error("[admin/survey-results] export", message);
    return Response.json({ ok: false, error: "Esportazione non riuscita." }, { status: 500 });
  }
}
