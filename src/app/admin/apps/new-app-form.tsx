"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppRecord, type AppInput } from "./actions";

export default function NewAppForm({ supportsPlacement }: { supportsPlacement: boolean }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [visibility, setVisibility] = useState("interno");
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const newApp: AppInput = {
      name,
      description: description || null,
      url: url || null,
      visibility,
    };
    if (supportsPlacement) {
      newApp.is_featured = isFeatured;
      newApp.display_order = displayOrder;
    }
    try {
      await createAppRecord(newApp);
    } catch (createError) {
      setLoading(false);
      setError(createError instanceof Error ? createError.message : "Creazione non riuscita.");
      return;
    }

    setLoading(false);
    setName("");
    setDescription("");
    setUrl("");
    setVisibility("interno");
    setIsFeatured(false);
    setDisplayOrder(0);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid form-grid-app">
      <div>
        <label className="muted">Nome</label>
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="muted">Descrizione</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="muted">URL</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/apps/nome-app" />
      </div>
      <div>
        <label className="muted">Visibile a</label>
        <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="interno">Solo interni True Design</option>
          <option value="cliente">Clienti</option>
          <option value="pubblica">Pubblica (senza login)</option>
        </select>
      </div>
      {supportsPlacement && (
        <>
          <label className="app-feature-toggle">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            In evidenza
          </label>
          <div>
            <label className="muted">Ordine</label>
            <input className="input" type="number" min="0" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
          </div>
        </>
      )}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Creazione…" : "Crea app"}
      </button>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
    </form>
  );
}
