import { createClient } from "@/lib/supabase-server";
import Brand from "../_components/brand";

export default async function PubblicoPage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name, description, url")
    .eq("visibility", "pubblica")
    .eq("is_active", true);

  return (
    <main className="page-shell">
      <div className="container">
        <header className="site-header dashboard-header">
          <Brand />
          <div className="header-actions">
            <a href="/login?tipo=cliente" className="btn btn-secondary">Accedi</a>
            <a href="/" className="btn">Torna alla home</a>
          </div>
        </header>

        <section className="dashboard-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Open tools</p>
              <h1 className="page-title">App pubbliche.</h1>
              <p className="lead">Strumenti True Design aperti a tutti, senza bisogno di accedere.</p>
            </div>
            <div className="stat-pill"><strong>{(apps ?? []).length}</strong> disponibili</div>
          </div>

          <div className="app-grid">
            {(apps ?? []).length === 0 && (
              <div className="empty-state">
                <h2>Presto nuovi strumenti</h2>
                <p className="muted">Al momento non ci sono app pubbliche disponibili.</p>
              </div>
            )}
            {(apps ?? []).map((app) => (
              <article key={app.id} className="card app-card">
                <div className="app-card-visual">
                  <span className="app-initial" aria-hidden="true">{app.name.trim().charAt(0).toLowerCase()}</span>
                  <span className="app-status">Open</span>
                </div>
                <div className="app-card-body">
                  <h2>{app.name}</h2>
                  <p className="muted">{app.description || "Uno strumento pubblico di True Design."}</p>
                  {app.url && (
                    <a className="btn" href={app.url} target="_blank" rel="noopener noreferrer">
                      Apri applicazione →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
