"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function NewAppForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [visibility, setVisibility] = useState("interno");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.from("apps").insert({
      name,
      description: description || null,
      url: url || null,
      visibility,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    setDescription("");
    setUrl("");
    setVisibility("interno");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "end" }}>
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
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="muted">Visibile a</label>
        <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="interno">Solo interni True Design</option>
          <option value="cliente">Clienti</option>
          <option value="pubblica">Pubblica (senza login)</option>
        </select>
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "..." : "Crea"}
      </button>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
    </form>
  );
}
