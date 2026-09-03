"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSurveyArchive, restoreSurveyArchive } from "./actions";
import SurveyConfirmDialog from "./survey-confirm-dialog";

export type SurveyArchiveListItem = {
  id: string;
  archivedAt: string;
  archivedByName: string | null;
  responseCount: number;
  preferenceCount: number;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  restoredAt: string | null;
};

type PendingOperation = { type: "restore" | "delete"; archive: SurveyArchiveListItem } | null;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

export default function ArchiveList({ archives }: { archives: SurveyArchiveListItem[] }) {
  const router = useRouter();
  const [operation, setOperation] = useState<PendingOperation>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm(value: string) {
    if (!operation) return;
    setMessage(null);
    startTransition(async () => {
      try {
      const result = operation.type === "restore"
        ? await restoreSurveyArchive(operation.archive.id, value)
        : await deleteSurveyArchive(operation.archive.id, value);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: operation.type === "restore"
          ? `${result.restoredCount ?? 0} risposte ripristinate.`
          : "Archivio eliminato definitivamente.",
      });
      setOperation(null);
      router.refresh();
      } catch {
        setMessage({ type: "error", text: "Operazione non riuscita. Riprova tra poco." });
      }
    });
  }

  if (archives.length === 0) {
    return <p className="muted">Nessun archivio creato.</p>;
  }

  return (
    <>
      {message && (
        <p className={message.type === "success" ? "success" : "error"} role="status" aria-live="polite">
          {message.text}
        </p>
      )}
      <div className="survey-archive-list">
        {archives.map((archive) => (
          <article key={archive.id} className="survey-archive-row">
            <div>
              <span className="survey-archive-date">{formatDate(archive.archivedAt)}</span>
              <strong>{archive.responseCount} risposte · {archive.preferenceCount} preferenze</strong>
              <small>
                {formatDate(archive.firstResponseAt)} — {formatDate(archive.lastResponseAt)}
                {archive.archivedByName ? ` · ${archive.archivedByName}` : ""}
              </small>
              {archive.restoredAt && <small>Ultimo ripristino: {formatDate(archive.restoredAt)}</small>}
            </div>
            <div className="survey-archive-actions">
              <a className="btn btn-secondary" href={`/admin/apps/true-sondaggio-iconici/archive/${archive.id}`}>Consulta</a>
              <a className="btn btn-secondary" href={`/admin/apps/true-sondaggio-iconici/export?archive=${archive.id}`}>Excel</a>
              <button className="btn btn-secondary" type="button" disabled={pending} onClick={() => { setMessage(null); setOperation({ type: "restore", archive }); }}>Ripristina</button>
              <button className="btn btn-danger-outline" type="button" disabled={pending} onClick={() => { setMessage(null); setOperation({ type: "delete", archive }); }}>Elimina</button>
            </div>
          </article>
        ))}
      </div>
      <SurveyConfirmDialog
        open={Boolean(operation)}
        title={operation?.type === "restore" ? "Ripristinare questo archivio?" : "Eliminare definitivamente l’archivio?"}
        description={operation?.type === "restore"
          ? "Gli eventuali risultati correnti verranno prima archiviati automaticamente, poi sostituiti con questa rilevazione."
          : "Questa operazione elimina l’archivio e tutte le risposte che contiene. Non sarà possibile recuperarle."}
        confirmWord={operation?.type === "restore" ? "RIPRISTINA" : "ELIMINA"}
        confirmLabel={operation?.type === "restore" ? "Ripristina archivio" : "Elimina definitivamente"}
        pending={pending}
        error={message?.type === "error" ? message.text : null}
        onCancel={() => setOperation(null)}
        onConfirm={confirm}
      />
    </>
  );
}
