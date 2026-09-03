import {
  listSurveyParticipants,
  normalizeSurveyChoices,
  rankSurveyProducts,
  type SurveyResponse,
} from "./survey-results";
import SurveyResponseDelete from "./survey-response-delete";

export function formatSurveyDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

export default function SurveyDatasetSections({ responses, allowResponseDeletion = false }: {
  responses: SurveyResponse[];
  allowResponseDeletion?: boolean;
}) {
  const participants = listSurveyParticipants(responses);
  const ranking = rankSurveyProducts(responses);
  const maxVotes = ranking[0]?.votes ?? 0;

  return (
    <>
      <section className="card panel survey-participants-panel">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Partecipanti</p>
            <h2 className="section-title">Persone che hanno votato</h2>
            <p className="muted">Tutti gli invii, dal più recente.</p>
          </div>
          <div className="stat-pill"><strong>{participants.length}</strong> totali</div>
        </div>

        {participants.length > 0 ? (
          <ol className="survey-participant-list">
            {participants.map((participant, index) => (
              <li key={participant.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{participant.name}</strong>
                <time dateTime={participant.submittedAt}>{formatSurveyDate(participant.submittedAt)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">Nessuna persona ha ancora completato il sondaggio.</p>
        )}
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
                <tr><th>Data e ora</th><th>Partecipante</th><th>Scelte</th>{allowResponseDeletion && <th>Azioni</th>}</tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr key={response.id}>
                    <td className="survey-response-date">{formatSurveyDate(response.submitted_at)}</td>
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
                    {allowResponseDeletion && (
                      <td>
                        <SurveyResponseDelete
                          responseId={response.id}
                          participantName={response.participant_name}
                          submittedAtLabel={formatSurveyDate(response.submitted_at)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nessuna risposta registrata.</p>
        )}
      </section>
    </>
  );
}
