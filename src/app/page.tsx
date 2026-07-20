import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "./_components/brand";
import HomeLogin from "./_components/home-login";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: publicApps } = await admin
    .from("apps")
    .select("id, name, url, display_order")
    .eq("visibility", "pubblica")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <header className="home-header">
          <Brand context="digital workspace" />
          <a href={user ? "/dashboard" : "#accesso"} className="home-header-action">
            {user ? "Le tue app" : "Accedi"} <span>↘</span>
          </a>
        </header>

        <div className="home-hero-copy">
          <p className="home-kicker">Extraordinary. Everyday.</p>
          <h1 id="home-title">Ideas,<br />made <em>real.</em></h1>
          <p>Strumenti digitali pensati da True Design per rendere straordinario il lavoro di ogni giorno.</p>
        </div>

        <a className="home-scroll-cue" href="#accesso" aria-label="Vai all’accesso">
          <span>Entra</span><b>↓</b>
        </a>
      </section>

      <section id="accesso" className="home-login-section" aria-labelledby="home-login-title">
        <div className="home-login-copy">
          <p className="home-kicker">Your space</p>
          <h2 id="home-login-title">Tutto ciò che ti serve.<br /><em>Nient’altro.</em></h2>
          <p>Accedi e ritrova soltanto le applicazioni scelte per te, in un unico spazio semplice e immediato.</p>
        </div>
        <div className="home-login-panel">
          <HomeLogin isAuthenticated={Boolean(user)} />
        </div>
      </section>

      <section className="home-apps-section" aria-labelledby="public-apps-title">
        <div className="home-apps-heading">
          <p className="home-kicker">Open tools</p>
          <h2 id="public-apps-title">Pronte.<br />Ora.</h2>
        </div>
        <div className="home-app-title-grid">
          {(publicApps ?? []).map((app, index) => app.url && (
            <a key={app.id} href={app.url} className={`home-app-title home-app-title-${index % 4}`}>
              <h3>{app.name}</h3>
            </a>
          ))}
          {(publicApps ?? []).length === 0 && (
            <div className="home-app-title home-app-title-empty"><h3>Nuovi strumenti, presto.</h3></div>
          )}
        </div>
      </section>

      <footer className="home-footer">
        <Brand />
        <p>Extraordinary. Everyday.</p>
      </footer>
    </main>
  );
}
