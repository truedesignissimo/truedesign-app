import { createAdminClient } from "@/lib/supabase-admin";
import { normalizeSurveyChoices, rankSurveyProducts, type SurveyResponse } from "./survey-results";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

export default async function SurveyResultsPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("survey_iconic_responses")
    .select("id, participant_name, choices, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(5000);

  const responses = (data ?? []) as SurveyResponse[];
  const ranking = rankSurveyProducts(responses);
  const totalVotes = ranking.reduce((sum, product) => sum + product.votes, 0);
  const maxVotes = ranking[0]?.votes ?? 0;
  const latestResponse = responses[0]?.submitted_at;

  return (
    <div className="admin-section-stack survey-results-dashboard">
      <div className="page-intro survey-results-intro">
        <div>
          <a className="admin-back-link" href="/admin/apps">← Applicazioni</a>
          <p className="eyebrow">Sondaggio Prodotti Iconici</p>
          <h1 className="page-title">Risultati.</h1>
          <p className="lead">Una lettura immediata delle collezioni che rappresentano meglio True.</p>
        </div>
        <a className="btn" href="/apps/true-sondaggio-iconici" target="_blank" rel="noreferrer">
          Apri il sondaggio ↗
        </a>
      </div>

      {error && (
        <p className="error">Non è stato possibile caricare i risultati: {error.message}</p>
      )}

      <section className="survey-results-metrics" aria-label="Riepilogo risultati">
        <article className="survey-result-metric survey-result-metric-primary">
          <span>Risposte</span>
          <strong>{responses.length}</strong>
          <small>partecipanti</small>
        </article>
        <article className="survey-result-metric">
          <span>Preferenze</span>
          <strong>{totalVotes}</strong>
          <small>voti complessivi</small>
        </article>
        <article className="survey-result-metric">
          <span>Prodotti votati</span>
          <strong>{ranking.length}</strong>
          <small>collezioni diverse</small>
        </article>
        <article className="survey-result-metric survey-result-metric-date">
          <span>Ultima risposta</span>
          <strong>{latestResponse ? formatDate(latestResponse) : "—"}</strong>
          <small>aggiornamento in tempo reale</small>
        </article>
      </section>

      <section className="card panel survey-ranking-panel">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Classifica</p>
            <h2 className="section-title">I prodotti più iconici</h2>
            <p className="muted">La percentuale indica quanti partecipanti hanno scelto ciascun prodotto.</p>
          </div>
        </div>

        {ranking.length > 0 ? (
          <ol className="survey-ranking-list">
            {ranking.map((product, index) => {
              const respondentShare = responses.length ? Math.round((product.votes / responses.length) * 100) : 0;
              const barWidth = maxVotes ? (product.votes / maxVotes) * 100 : 0;

              return (
                <li key={product.name}>
                  <span className="survey-ranking-position">{String(index + 1).padStart(2, "0")}</span>
                  <div className="survey-ranking-product">
                    {product.url ? (
                      <a href={product.url} target="_blank" rel="noreferrer">{product.name}</a>
                    ) : (
                      <strong>{product.name}</strong>
                    )}
                    <span className="survey-ranking-track" aria-hidden="true">
                      <i style={{ width: `${barWidth}%` }} />
                    </span>
                  </div>
                  <div className="survey-ranking-score">
                    <strong>{product.votes}</strong>
                    <span>{respondentShare}%</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="survey-results-empty">
            <strong>In attesa delle prime risposte.</strong>
            <p>La classifica comparirà qui appena qualcuno completerà il sondaggio.</p>
          </div>
        )}
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Dettaglio</p>
            <h2 className="section-title">Risposte individuali</h2>
            <p className="muted">Tutte le selezioni, dalla più recente.</p>
          </div>
          <div className="stat-pill"><strong>{responses.length}</strong> totali</div>
        </div>

        {responses.length > 0 ? (
          <div className="table-wrap survey-response-table">
            <table>
              <thead>
                <tr><th>Data e ora</th><th>Partecipante</th><th>Scelte</th></tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr key={response.id}>
                    <td className="survey-response-date">{formatDate(response.submitted_at)}</td>
                    <td><strong>{response.participant_name}</strong></td>
                    <td>
                      <div className="survey-choice-list">
                        {normalizeSurveyChoices(response.choices).map((choice) => (
                          choice.url ? (
                            <a key={`${response.id}-${choice.name}`} href={choice.url} target="_blank" rel="noreferrer">
                              {choice.name}
                            </a>
                          ) : (
                            <span key={`${response.id}-${choice.name}`}>{choice.name}</span>
                          )
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nessuna risposta registrata.</p>
        )}
      </section>
    </div>
  );
}
