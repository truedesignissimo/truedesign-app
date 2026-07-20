import { createClient } from "@/lib/supabase-server";
import Brand from "./_components/brand";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="page-shell">
      <div className="container">
        <header className="site-header">
          <Brand />
          {user ? (
            <a href="/dashboard" className="btn">
              La tua dashboard →
            </a>
          ) : (
            <a href="/pubblico" className="btn btn-secondary">
              Esplora le app
            </a>
          )}
        </header>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">True digital workspace</p>
            <h1 className="display-title">
              Le idee, gli strumenti, il <em>fare.</em>
            </h1>
            <p className="lead">
              Un unico spazio per accedere alle applicazioni che semplificano il lavoro
              quotidiano di clienti e team True Design.
            </p>
            <p className="hero-note">Progettato per essere semplice. Costruito per evolvere.</p>
          </div>

          <aside className="hero-panel" aria-label="True Workspace">
            <span className="hero-panel-label">Extraordinary. Everyday.</span>
            <div className="hero-panel-copy">
              Strumenti digitali per trasformare processi complessi in gesti semplici.
            </div>
          </aside>
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
      </div>
    </main>
  );
}
