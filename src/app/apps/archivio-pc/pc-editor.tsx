"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { archivePcAsset, createPcAsset, updatePcAsset } from "./actions";
import type { PcRecord } from "./domain/archive";
import { EDIT_FIELDS, FIELD_GROUPS, PROFILES, type EditorResult } from "./domain/editor";
import { pcImages } from "./image-map";
import styles from "./archive-pc.module.css";

type Props = {
  pc: PcRecord | null;
  version?: string;
  areas: string[];
  types: string[];
  onExit: (saved: boolean) => void;
  onBusy: (busy: boolean) => void;
};

export function PcEditor({ pc, version, areas, types, onExit, onBusy }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<Extract<EditorResult, { ok: false }> | null>(null);

  async function run(operation: () => Promise<EditorResult>) {
    setBusy(true);
    onBusy(true);
    setError(null);
    try {
      const result = await operation();
      if (result.ok) {
        onExit(true);
        router.refresh();
      } else {
        setError(result);
      }
    } catch {
      setError({ ok: false, error: "Operazione non riuscita. Riprova tra poco." });
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmArchive) return;
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(EDIT_FIELDS.map(([key]) => [key, form.get(key)]));
    void run(() => pc ? updatePcAsset(pc.id, version ?? "", input) : createPcAsset(input));
  }

  return (
    <form className={styles.editor} onSubmit={submit} aria-busy={busy}>
      <h2 id="pc-detail-title">{pc ? `Modifica ${pc.assegnatario}` : "Aggiungi PC"}</h2>
      <datalist id="pc-editor-areas">{areas.map((area) => <option key={area} value={area} />)}</datalist>
      <datalist id="pc-editor-types">{types.map((type) => <option key={type} value={type} />)}</datalist>
      {FIELD_GROUPS.map(([group, fields]) => (
        <fieldset key={group} disabled={busy || confirmArchive} className={styles.editorGroup}>
          <legend>{group}</legend>
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              {key === "profilo" ? (
                <select name={key} defaultValue={pc?.profilo ?? "Ufficio"}>
                  {PROFILES.map((profile) => <option key={profile}>{profile}</option>)}
                </select>
              ) : key === "foto" ? (
                <select name={key} defaultValue={pc?.foto ?? ""}>
                  <option value="">Nessuna immagine</option>
                  {Object.keys(pcImages).map((image) => <option key={image}>{image}</option>)}
                </select>
              ) : key === "note" ? (
                <textarea name={key} defaultValue={pc?.note} maxLength={2000} rows={3} />
              ) : (
                <input name={key} defaultValue={pc?.[key]} maxLength={200}
                  required={key === "assegnatario" || key === "tipologia"}
                  list={key === "area" ? "pc-editor-areas" : key === "tipologia" ? "pc-editor-types" : undefined}
                  autoFocus={key === "assegnatario"} aria-invalid={error?.field === key || undefined} />
              )}
              {error?.field === key && <small>{error.error}</small>}
            </label>
          ))}
        </fieldset>
      ))}
      <div className={styles.editorFooter}>
        <p role="alert" hidden={!error}>{error?.error}</p>
        {confirmArchive && pc ? (
          <div className={styles.editorButtons}>
            <p>Archiviare {pc.assegnatario} e rimuoverlo dalla vista pubblica?</p>
            <button type="button" disabled={busy} onClick={() => setConfirmArchive(false)}>Annulla</button>
            <button type="button" disabled={busy} onClick={() => void run(() => archivePcAsset(pc.id, version ?? ""))}>
              {busy ? "Archiviazione…" : "Conferma archiviazione"}
            </button>
          </div>
        ) : (
          <div className={styles.editorButtons}>
            {pc && <button type="button" disabled={busy} onClick={() => setConfirmArchive(true)}>Archivia</button>}
            <button type="button" disabled={busy} onClick={() => onExit(false)}>Annulla</button>
            <button type="submit" disabled={busy}>{busy ? "Salvataggio…" : "Salva"}</button>
          </div>
        )}
      </div>
    </form>
  );
}
