import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "./_components/brand";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: publicApps } = await admin
    .from("apps")
    .select("id, name, description, url, is_featured, display_order")
    .eq("visibility", "pubblica")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <main className="page-shell home-page">
      <div className="container">
        <header className="site-header">
          <Brand />
          {user ? (
            <a href="/dashboard" className="btn">
              Le tue app →
            </a>
          ) : (
            <a href="/pubblico" className="btn btn-secondary">
              Esplora le app
            </a>
          )}
        </header>

        <section className="hero home-hero">
          <div className="hero-copy">
            <p className="eyebrow">Extraordinary. Everyday.</p>
            <h1 className="display-title">
              Le idee, gli strumenti, il <em>fare.</em>
            </h1>
            <p className="lead">
              Un unico spazio per accedere alle applicazioni che semplificano il lavoro
              quotidiano di clienti e team True Design.
            </p>
            <p className="hero-note">Progettato per essere semplice. Costruito per evolvere.</p>
          </div>
        </section>

        <section className="home-public-section" aria-labelledby="public-apps-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open tools</p>
              <h2 id="public-apps-title" className="section-title">App pubbliche</h2>
            </div>
            <p className="muted">Pronte da usare, senza registrazione.</p>
          </div>
          <div className="app-grid">
            {(publicApps ?? []).map((app) => (
              <article key={app.id} className={`card app-card ${app.is_featured ? "app-card-featured" : ""}`}>
                <div className="app-card-visual">
                  <span className="app-initial" aria-hidden="true">{app.name.trim().charAt(0).toLowerCase()}</span>
                  <span className="app-status">{app.is_featured ? "In evidenza" : "Open"}</span>
                </div>
                <div className="app-card-body">
                  <h2>{app.name}</h2>
                  <p className="muted">{app.description || "Uno strumento pubblico di True Design."}</p>
                  {app.url && <a className="btn" href={app.url}>Apri applicazione →</a>}
                </div>
              </article>
            ))}
            {(publicApps ?? []).length === 0 && (
              <div className="empty-state">
                <h2>Presto nuovi strumenti</h2>
                <p className="muted">Le app impostate come pubbliche compariranno qui automaticamente.</p>
              </div>
            )}
          </div>
        </section>

        <section className="access-section" aria-labelledby="access-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Accesso</p>
              <h2 id="access-title" className="section-title">Scegli il tuo spazio</h2>
            </div>
            <p className="muted">Ogni profilo vede solo gli strumenti dedicati.</p>
          </div>

          <div className="access-grid">
            <a href="/login?tipo=cliente" className="access-card access-card-featured">
              <span className="access-index">01 / CLIENTI</span>
              <div>
                <h2>Area clienti</h2>
                <p className="muted">Progetti, configuratori e servizi riservati.</p>
                <span className="access-arrow" aria-hidden="true">→</span>
              </div>
            </a>

            <a href="/login?tipo=interno" className="access-card">
              <span className="access-index">02 / TEAM</span>
              <div>
                <h2>Area True</h2>
                <p className="muted">Gli strumenti operativi per il team interno.</p>
                <span className="access-arrow" aria-hidden="true">→</span>
              </div>
            </a>

            <a href="/pubblico" className="access-card">
              <span className="access-index">03 / OPEN</span>
              <div>
                <h2>App pubbliche</h2>
                <p className="muted">Scopri gli strumenti disponibili senza accesso.</p>
                <span className="access-arrow" aria-hidden="true">→</span>
              </div>
            </a>
          </div>
        </section>

        {!user && (
          <div className="home-register-note">
            <span>Non hai ancora un account?</span>
            <a href="/registrati">Registrati al workspace →</a>
          </div>
        )}
      </div>
    </main>
  );
}
