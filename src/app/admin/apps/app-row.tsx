"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

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
  const supabase = createClient();
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
    const update: Record<string, string | number | boolean | null> = {
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim() || null,
      visibility,
    };
    if (supportsPlacement) {
      update.is_featured = isFeatured;
      update.display_order = displayOrder;
    }

    const { error: updateError } = await supabase.from("apps").update(update).eq("id", app.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function toggleActive() {
    setError(null);
    const { error: updateError } = await supabase
      .from("apps")
      .update({ is_active: !app.is_active })
      .eq("id", app.id);
    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  async function deleteApp() {
    if (!confirm(`Eliminare l'app "${app.name}"? Verranno rimosse anche le assegnazioni e i log collegati.`)) return;
    const { error: deleteError } = await supabase.from("apps").delete().eq("id", app.id);
    if (deleteError) setError(deleteError.message);
    else router.refresh();
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
