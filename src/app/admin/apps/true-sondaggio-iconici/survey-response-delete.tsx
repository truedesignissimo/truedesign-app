"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSurveyResponse } from "./actions";
import SurveyConfirmDialog from "./survey-confirm-dialog";

export default function SurveyResponseDelete({ responseId, participantName, submittedAtLabel }: {
  responseId: string;
  participantName: string;
  submittedAtLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove(confirmation: string) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteSurveyResponse(responseId, confirmation);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError("Operazione non riuscita. Riprova tra poco.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-danger-outline"
        aria-label={`Elimina risposta di ${participantName}, ${submittedAtLabel}`}
        disabled={pending}
        onClick={() => { setError(null); setOpen(true); }}
      >
        Elimina
      </button>
      <SurveyConfirmDialog
        open={open}
        title="Elimina questa risposta?"
        description={`La risposta di ${participantName}, inviata il ${submittedAtLabel}, verrà eliminata definitivamente dai risultati correnti. Gli archivi già salvati non verranno modificati.`}
        confirmWord="ELIMINA"
        confirmLabel="Elimina risposta"
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={remove}
      />
    </>
  );
}
