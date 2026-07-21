import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "./_components/brand";
import HomeLogin from "./_components/home-login";
import HomeHeroSlideshow from "./_components/home-hero-slideshow";
import HomeAppLink from "./_components/home-app-link";
import SignOutButton from "./dashboard/sign-out-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await admin.from("profiles").select("is_admin, approval_status").eq("id", user.id).maybeSingle()
    : { data: null };

  let workspaceApps: Array<{ id: string; name: string; url: string; display_order?: number | null }> = [];
  if (user && profile?.approval_status === "approved") {
    if (profile.is_admin) {
      const { data } = await admin
        .from("apps")
        .select("id, name, url, display_order")
        .eq("is_active", true)
        .not("url", "is", null)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      workspaceApps = (data ?? []).filter((app): app is typeof app & { url: string } => Boolean(app.url));
    } else {
      const { data } = await admin
        .from("user_apps")
        .select("apps(id, name, url, is_active, display_order)")
        .eq("user_id", user.id);
      workspaceApps = (data ?? [])
        .map((row: any) => row.apps)
        .filter((app: any) => app?.is_active && app?.url)
        .sort((first: any, second: any) =>
          (first.display_order ?? 0) - (second.display_order ?? 0) || first.name.localeCompare(second.name, "it")
        );
    }
  }

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <HomeHeroSlideshow />
        <header className="home-header">
          <Brand context="digital workspace" />
          <div className="home-header-actions">
            {user && profile?.is_admin && (
              <a href="/admin" className="home-header-action home-header-action-primary">Console</a>
            )}
            {user ? (
              <>
                <a href="/dashboard" className="home-header-action">Le tue app</a>
                <SignOutButton className="home-header-action home-header-button" redirectTo="/" label="Logout" />
              </>
            ) : (
              <a href="#accesso" className="home-header-action">Accedi <span>↘</span></a>
            )}
          </div>
        </header>

        <div className="home-hero-copy">
          <p className="home-kicker">Extraordinary. Everyday.</p>
          <h1 id="home-title">Ideas,<br />made <em>real.</em></h1>
          <p>Strumenti digitali pensati da True per rendere straordinario il lavoro di ogni giorno.</p>
        </div>

        <a className="home-scroll-cue" href="#accesso" aria-label="Vai all’accesso">
          <span>Entra</span><b>↓</b>
        </a>
      </section>

      <section id="accesso" className="home-login-section" aria-labelledby="home-login-title">
        <div className="home-login-copy">
          <p className="home-kicker">Your space</p>
          <h2 id="home-login-title">Il tuo spazio<br /><em>è pronto.</em></h2>
          <p className="home-workspace-claim">Usa subito le app.</p>
        </div>
        <div className="home-workspace-content">
          {user && profile?.approval_status === "approved" ? (
            <div className="home-workspace-apps" aria-label="Applicazioni disponibili">
              {workspaceApps.map((app) => (
                <HomeAppLink key={app.id} appId={app.id} name={app.name} url={app.url} />
              ))}
              {workspaceApps.length === 0 && (
                <div className="home-workspace-empty">Le app assegnate compariranno qui.</div>
              )}
            </div>
          ) : (
            <div className="home-login-panel">
              <HomeLogin isAuthenticated={Boolean(user)} />
            </div>
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
