"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAppRecord,
  setAppActive,
  updateAppRecord,
  type AppInput,
} from "./actions";

type App = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  is_active: boolean;
  visibility: string;
  is_featured: boolean;
  display_order: number;
};

export default function AppRow({ app, supportsPlacement }: { app: App; supportsPlacement: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [url, setUrl] = useState(app.url ?? "");
  const [visibility, setVisibility] = useState(app.visibility);
  const [isFeatured, setIsFeatured] = useState(app.is_featured);
  const [displayOrder, setDisplayOrder] = useState(app.display_order);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const hasResultsDashboard = app.url === "/apps/true-sondaggio-iconici";
  const isDirty =
    name !== app.name ||
    description !== (app.description ?? "") ||
    url !== (app.url ?? "") ||
    visibility !== app.visibility ||
    (supportsPlacement && (isFeatured !== app.is_featured || displayOrder !== app.display_order));

  function beginEdit() {
    setError(null);
    setSaved(false);
  }

  function resetChanges() {
    setName(app.name);
    setDescription(app.description ?? "");
    setUrl(app.url ?? "");
    setVisibility(app.visibility);
    setIsFeatured(app.is_featured);
    setDisplayOrder(app.display_order);
    setError(null);
    setSaved(false);
  }

  async function saveApp() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const update: AppInput = {
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim() || null,
      visibility,
    };
    if (supportsPlacement) {
      update.is_featured = isFeatured;
      update.display_order = displayOrder;
    }

    try {
      const result = await updateAppRecord(app.id, update);
      if (!result.ok) {
        setSaving(false);
        setError(result.error);
        return;
      }
    } catch (updateError) {
      setSaving(false);
      setError(updateError instanceof Error ? updateError.message : "Salvataggio non riuscito.");
      return;
    }
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function toggleActive() {
    setError(null);
    setSaved(false);
    setChangingStatus(true);
    try {
      const result = await setAppActive(app.id, !app.is_active);
      if (!result.ok) {
        setChangingStatus(false);
        setError(result.error);
        return;
      }
      setChangingStatus(false);
      router.refresh();
    } catch (updateError) {
      setChangingStatus(false);
      setError(updateError instanceof Error ? updateError.message : "Aggiornamento non riuscito.");
    }
  }

  async function deleteApp() {
    if (!confirm(`Eliminare l'app "${app.name}"? Verranno rimosse anche le assegnazioni e i log collegati.`)) return;
    try {
      const result = await deleteAppRecord(app.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Eliminazione non riuscita.");
    }
  }

  return (
    <>
      <tr className={`app-admin-row ${isDirty ? "app-admin-row-dirty" : ""}`}>
        <td>
          <input
            className="input app-name-input"
            value={name}
            onChange={(event) => { beginEdit(); setName(event.target.value); }}
            aria-label="Nome applicazione"
            maxLength={120}
          />
          <textarea
            className="input app-description-input"
            value={description}
            onChange={(event) => { beginEdit(); setDescription(event.target.value); }}
            aria-label="Descrizione applicazione"
            placeholder="Descrizione"
            maxLength={1000}
          />
        </td>
        <td>
          <input
            className="input app-url-input"
            value={url}
            onChange={(event) => { beginEdit(); setUrl(event.target.value); }}
            aria-label="URL applicazione"
            placeholder="/apps/nome"
            spellCheck={false}
          />
        </td>
        <td>
          <select
            className="input"
            value={visibility}
            onChange={(event) => { beginEdit(); setVisibility(event.target.value); }}
            aria-label="Visibilità applicazione"
          >
            <option value="interno">Team interno</option>
            <option value="cliente">Clienti</option>
            <option value="pubblica">Pubblica</option>
          </select>
        </td>
        <td>
          {supportsPlacement ? (
            <label className="app-feature-toggle compact">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => { beginEdit(); setIsFeatured(event.target.checked); }}
              />
              In evidenza
            </label>
          ) : <span className="muted">Standard</span>}
        </td>
        <td>
          {supportsPlacement ? (
            <input
              className="input app-order-input"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(event) => { beginEdit(); setDisplayOrder(Number(event.target.value)); }}
              aria-label="Ordine applicazione"
            />
          ) : <span className="muted">—</span>}
        </td>
        <td>
          <button
            className={`btn ${app.is_active ? "btn-status-active" : "btn-secondary"}`}
            onClick={toggleActive}
            disabled={changingStatus}
          >
            {changingStatus ? "Aggiorno…" : app.is_active ? "Online" : "In pausa"}
          </button>
        </td>
        <td>
          <div className="app-row-actions">
            <button className="btn" onClick={saveApp} disabled={saving || !name.trim() || !isDirty}>
              {saving ? "Salvo…" : "Salva"}
            </button>
            {isDirty && (
              <button className="btn btn-secondary" onClick={resetChanges}>Annulla</button>
            )}
            {hasResultsDashboard && (
              <a className="btn btn-secondary" href="/admin/apps/true-sondaggio-iconici">Risultati</a>
            )}
            <button className="btn btn-danger" onClick={deleteApp}>Elimina</button>
          </div>
        </td>
      </tr>
      {(saved || error) && (
        <tr className="app-row-message" aria-live="polite">
          <td colSpan={7}>
            {saved ? (
              <div className="app-row-notice app-row-notice-success"><strong>Modifiche salvate.</strong> Il catalogo è stato aggiornato.</div>
            ) : (
              <div className="app-row-notice app-row-notice-error"><strong>Salvataggio non riuscito.</strong> {error}</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
