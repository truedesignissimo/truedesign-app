import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "../_components/brand";

export const dynamic = "force-dynamic";

export default async function PubblicoPage() {
  const admin = createAdminClient();

  const placementResult = await admin
    .from("apps")
    .select("id, name, description, url, is_featured, display_order")
    .eq("visibility", "pubblica")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const fallbackResult = placementResult.error
    ? await admin
        .from("apps")
        .select("id, name, description, url")
        .eq("visibility", "pubblica")
        .eq("is_active", true)
        .order("name", { ascending: true })
    : null;

  const apps = placementResult.error
    ? (fallbackResult?.data ?? []).map((app) => ({ ...app, is_featured: false, display_order: 0 }))
    : placementResult.data;

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
              <article key={app.id} className={`card app-card ${app.is_featured ? "app-card-featured" : ""}`}>
                <div className="app-card-visual">
                  <span className="app-initial" aria-hidden="true">{app.name.trim().charAt(0).toLowerCase()}</span>
                  <span className="app-status">{app.is_featured ? "In evidenza" : "Open"}</span>
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
