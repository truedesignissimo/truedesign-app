import { createAdminClient } from "@/lib/supabase-admin";
import ArchiveList, { type SurveyArchiveListItem } from "./archive-list";
import SurveyAdminActions from "./survey-admin-actions";
import SurveyDatasetSections, { formatSurveyDate } from "./survey-dataset-sections";
import { buildSurveySummary, type SurveyResponse } from "./survey-results";

export const dynamic = "force-dynamic";

type ArchiveRow = {
  id: string;
  archived_at: string;
  archived_by: string | null;
  response_count: number;
  preference_count: number;
  first_response_at: string | null;
  last_response_at: string | null;
  restored_at: string | null;
};

export default async function SurveyResultsPage() {
  const admin = createAdminClient();
  const [responsesResult, archivesResult] = await Promise.all([
    admin
      .from("survey_iconic_responses")
      .select("id, participant_name, choices, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5000),
    admin
      .from("survey_iconic_archives")
      .select("id, archived_at, archived_by, response_count, preference_count, first_response_at, last_response_at, restored_at")
      .order("archived_at", { ascending: false })
      .limit(200),
  ]);

  const responses = (responsesResult.data ?? []) as SurveyResponse[];
  const archiveRows = (archivesResult.data ?? []) as ArchiveRow[];
  const actorIds = [...new Set(archiveRows.map((archive) => archive.archived_by).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  const actorNames = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name]));
  const archives: SurveyArchiveListItem[] = archiveRows.map((archive) => ({
    id: archive.id,
    archivedAt: archive.archived_at,
    archivedByName: archive.archived_by ? actorNames.get(archive.archived_by) ?? null : null,
    responseCount: archive.response_count,
    preferenceCount: archive.preference_count,
    firstResponseAt: archive.first_response_at,
    lastResponseAt: archive.last_response_at,
    restoredAt: archive.restored_at,
  }));
  const summary = buildSurveySummary(responses);
  const error = responsesResult.error ?? archivesResult.error;

  return (
    <div className="admin-section-stack survey-results-dashboard">
      <div className="page-intro survey-results-intro">
        <div>
          <a className="admin-back-link" href="/admin/apps">← Applicazioni</a>
          <p className="eyebrow">Sondaggio Prodotti Iconici</p>
          <h1 className="page-title">Risultati.</h1>
          <p className="lead">Una lettura immediata delle collezioni che rappresentano meglio True.</p>
        </div>
        <SurveyAdminActions hasResponses={responses.length > 0} />
      </div>

      {error && (
        <p className="error">Non è stato possibile caricare tutti i dati. Riprova tra poco.</p>
      )}

      <section className="survey-results-metrics" aria-label="Riepilogo risultati">
        <article className="survey-result-metric survey-result-metric-primary">
          <span>Risposte</span>
          <strong>{summary.responses}</strong>
          <small>partecipanti</small>
        </article>
        <article className="survey-result-metric">
          <span>Preferenze</span>
          <strong>{summary.preferences}</strong>
          <small>voti complessivi</small>
        </article>
        <article className="survey-result-metric">
          <span>Prodotti votati</span>
          <strong>{summary.products}</strong>
          <small>collezioni diverse</small>
        </article>
        <article className="survey-result-metric survey-result-metric-date">
          <span>Ultima risposta</span>
          <strong>{summary.lastResponseAt ? formatSurveyDate(summary.lastResponseAt) : "—"}</strong>
          <small>aggiornamento in tempo reale</small>
        </article>
      </section>

      <SurveyDatasetSections responses={responses} allowResponseDeletion />

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Archivio</p>
            <h2 className="section-title">Rilevazioni precedenti</h2>
            <p className="muted">Consulta, esporta, ripristina o elimina gli azzeramenti salvati.</p>
          </div>
          <div className="stat-pill"><strong>{archives.length}</strong> archivi</div>
        </div>
        <ArchiveList archives={archives} />
      </section>
    </div>
  );
}
