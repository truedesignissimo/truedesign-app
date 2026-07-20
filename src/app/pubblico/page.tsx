import { createClient } from "@/lib/supabase-server";

export default async function PubblicoPage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name, description, url")
    .eq("visibility", "pubblica")
    .eq("is_active", true);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>App pubbliche</h1>
          <p className="muted">Nessun accesso richiesto</p>
        </div>
        <a href="/" className="btn btn-secondary">Torna alla home</a>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginTop: "1.5rem" }}>
        {(apps ?? []).length === 0 && (
          <p className="muted">Nessuna app pubblica disponibile al momento.</p>
        )}
        {(apps ?? []).map((app) => (
          <div key={app.id} className="card app-card">
            <strong>{app.name}</strong>
            {app.description && <span className="muted">{app.description}</span>}
            {app.url && (
              <a className="btn" href={app.url} target="_blank" rel="noopener noreferrer">
                Apri
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
