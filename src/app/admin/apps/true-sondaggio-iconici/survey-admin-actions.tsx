"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveAndResetSurvey } from "./actions";
import SurveyConfirmDialog from "./survey-confirm-dialog";

export default function SurveyAdminActions({ hasResponses }: { hasResponses: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function reset(confirmation: string) {
    setMessage(null);
    startTransition(async () => {
      try {
      const result = await archiveAndResetSurvey(confirmation);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setOpen(false);
      setMessage({ type: "success", text: `${result.count ?? 0} risposte archiviate. Il sondaggio è pronto per una nuova rilevazione.` });
      router.refresh();
      } catch {
        setMessage({ type: "error", text: "Operazione non riuscita. Riprova tra poco." });
      }
    });
  }

  return (
    <div className="survey-admin-actions-wrap">
      <div className="survey-admin-actions">
        <a
          className={`btn btn-secondary${hasResponses ? "" : " is-disabled"}`}
          href={hasResponses ? "/admin/apps/true-sondaggio-iconici/export" : undefined}
          aria-disabled={!hasResponses}
        >
          Scarica Excel
        </a>
        <button className="btn btn-danger-outline" type="button" onClick={() => { setMessage(null); setOpen(true); }} disabled={!hasResponses || pending}>
          Azzera risultati
        </button>
        <a className="btn" href="/apps/true-sondaggio-iconici" target="_blank" rel="noreferrer">
          Apri il sondaggio ↗
        </a>
      </div>
      {message && (
        <p className={message.type === "success" ? "success" : "error"} role="status" aria-live="polite">
          {message.text}
        </p>
      )}
      <SurveyConfirmDialog
        open={open}
        title="Archivia e azzera i risultati?"
        description="Le risposte correnti verranno prima salvate in un archivio datato e poi rimosse dalla rilevazione attiva."
        confirmWord="AZZERA"
        confirmLabel="Archivia e azzera"
        pending={pending}
        error={message?.type === "error" ? message.text : null}
        onCancel={() => setOpen(false)}
        onConfirm={reset}
      />
    </div>
  );
}
