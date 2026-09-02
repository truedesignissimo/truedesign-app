import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import SurveyDatasetSections, { formatSurveyDate } from "../../survey-dataset-sections";
import { buildSurveySummary, type SurveyResponse } from "../../survey-results";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function SurveyArchivePage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;
  if (!UUID_PATTERN.test(archiveId)) notFound();

  const admin = createAdminClient();
  const [archiveResult, responsesResult] = await Promise.all([
    admin
      .from("survey_iconic_archives")
      .select("id, archived_at")
      .eq("id", archiveId)
      .maybeSingle(),
    admin
      .from("survey_iconic_archive_responses")
      .select("id, participant_name, choices, submitted_at")
      .eq("archive_id", archiveId)
      .order("submitted_at", { ascending: false })
      .limit(5000),
  ]);

  if (archiveResult.error || !archiveResult.data) notFound();
  const responses = (responsesResult.data ?? []) as SurveyResponse[];
  const summary = buildSurveySummary(responses);

  return (
    <div className="admin-section-stack survey-results-dashboard">
      <div className="page-intro survey-results-intro">
        <div>
          <a className="admin-back-link" href="/admin/apps/true-sondaggio-iconici">← Risultati correnti</a>
          <p className="eyebrow">Archivio Sondaggio Prodotti Iconici</p>
          <h1 className="page-title">{formatSurveyDate(archiveResult.data.archived_at)}</h1>
          <p className="lead">Fotografia completa della rilevazione archiviata.</p>
        </div>
        <a className="btn" href={`/admin/apps/true-sondaggio-iconici/export?archive=${archiveId}`}>
          Scarica Excel
        </a>
      </div>

      {responsesResult.error && <p className="error">Non è stato possibile caricare le risposte archiviate.</p>}

      <section className="survey-results-metrics" aria-label="Riepilogo archivio">
        <article className="survey-result-metric survey-result-metric-primary">
          <span>Risposte</span><strong>{summary.responses}</strong><small>partecipanti</small>
        </article>
        <article className="survey-result-metric">
          <span>Preferenze</span><strong>{summary.preferences}</strong><small>voti complessivi</small>
        </article>
        <article className="survey-result-metric">
          <span>Prodotti votati</span><strong>{summary.products}</strong><small>collezioni diverse</small>
        </article>
        <article className="survey-result-metric survey-result-metric-date">
          <span>Ultima risposta</span>
          <strong>{summary.lastResponseAt ? formatSurveyDate(summary.lastResponseAt) : "—"}</strong>
          <small>rilevazione archiviata</small>
        </article>
      </section>

      <SurveyDatasetSections responses={responses} />
    </div>
  );
}
