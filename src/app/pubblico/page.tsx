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
              app.url ? (
                <a key={app.id} className="app-title-card" href={app.url}>
                  <h2>{app.name}</h2>
                </a>
              ) : (
                <div key={app.id} className="app-title-card app-title-card-disabled" aria-disabled="true">
                  <h2>{app.name}</h2>
                </div>
              )
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
