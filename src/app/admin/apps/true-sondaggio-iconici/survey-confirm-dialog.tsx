"use client";

import { useEffect, useRef, useState } from "react";

type SurveyConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (confirmation: string) => void;
};

export default function SurveyConfirmDialog({
  open,
  title,
  description,
  confirmWord,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: SurveyConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setConfirmation("");
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="survey-confirm-dialog"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onCancel();
      }}
      onClose={() => {
        if (open && !pending) onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div className="survey-confirm-dialog-panel">
        <p className="eyebrow">Conferma operazione</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        <label>
          <span>Scrivi <strong>{confirmWord}</strong> per continuare</span>
          <input
            className="input"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoFocus
            autoComplete="off"
            disabled={pending}
          />
        </label>
        <div className="survey-confirm-dialog-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={pending}>
            Annulla
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => onConfirm(confirmation)}
            disabled={pending || confirmation !== confirmWord}
          >
            {pending ? "Operazione in corso…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
