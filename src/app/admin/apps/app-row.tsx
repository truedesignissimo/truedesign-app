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
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      await updateAppRecord(app.id, update);
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
    try {
      await setAppActive(app.id, !app.is_active);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Aggiornamento non riuscito.");
    }
  }

  async function deleteApp() {
    if (!confirm(`Eliminare l'app "${app.name}"? Verranno rimosse anche le assegnazioni e i log collegati.`)) return;
    try {
      await deleteAppRecord(app.id);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Eliminazione non riuscita.");
    }
  }

  return (
    <tr className="app-admin-row">
      <td>
        <input className="input app-name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome applicazione" />
        <textarea className="input app-description-input" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Descrizione applicazione" placeholder="Descrizione" />
      </td>
      <td>
        <input className="input app-url-input" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL applicazione" placeholder="/apps/nome" />
      </td>
      <td>
        <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="interno">Team interno</option>
          <option value="cliente">Clienti</option>
          <option value="pubblica">Pubblica</option>
        </select>
      </td>
      <td>
        {supportsPlacement ? (
          <label className="app-feature-toggle compact">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            In evidenza
          </label>
        ) : <span className="muted">Standard</span>}
      </td>
      <td>
        {supportsPlacement ? (
          <input className="input app-order-input" type="number" min="0" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} aria-label="Ordine applicazione" />
        ) : <span className="muted">—</span>}
      </td>
      <td>
        <button className={`btn ${app.is_active ? "btn-status-active" : "btn-secondary"}`} onClick={toggleActive}>
          {app.is_active ? "Online" : "In pausa"}
        </button>
      </td>
      <td>
        <div className="app-row-actions">
          <button className="btn" onClick={saveApp} disabled={saving || !name.trim()}>{saving ? "Salvo…" : "Salva"}</button>
          <button className="btn btn-danger" onClick={deleteApp}>Elimina</button>
        </div>
        {saved && <span className="app-row-feedback success-text">Salvata</span>}
        {error && <span className="app-row-feedback error">{error}</span>}
      </td>
    </tr>
  );
}
