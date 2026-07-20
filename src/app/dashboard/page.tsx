import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Brand from "../_components/brand";
import SignOutButton from "./sign-out-button";
import AppLink from "./app-link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name, user_type")
    .eq("id", user.id)
    .single();

  let visibilityQuery = supabase
    .from("apps")
    .select("id, name, description, url")
    .eq("is_active", true);

  if (!profile?.is_admin) {
    const visibleTypes = ["pubblica", profile?.user_type ?? "cliente"];
    visibilityQuery = visibilityQuery.in("visibility", visibleTypes);
  }

  const { data: visibleApps } = await visibilityQuery;

  const { data: userApps } = await supabase
    .from("user_apps")
    .select("apps(id, name, description, url)")
    .eq("user_id", user.id);

  const assignedApps = (userApps ?? [])
    .map((row: any) => row.apps)
    .filter(Boolean);

  const appsById = new Map<string, any>();
  [...(visibleApps ?? []), ...assignedApps].forEach((app) => {
    if (app) appsById.set(app.id, app);
  });
  const apps = Array.from(appsById.values());

  return (
    <main className="page-shell">
      <div className="container">
        <header className="site-header dashboard-header">
          <Brand />
          <div className="header-actions">
            {profile?.is_admin && (
              <a href="/admin" className="btn btn-secondary">Amministrazione</a>
            )}
            <SignOutButton />
          </div>
        </header>

        <section className="dashboard-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">
                {profile?.is_admin ? "Profilo amministratore" : profile?.user_type === "interno" ? "Team True" : "Area clienti"}
              </p>
              <h1 className="page-title">
                Ciao{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
              </h1>
              <p className="lead">Tutto quello che ti serve, pronto da aprire.</p>
            </div>
            <div className="stat-pill">
              <strong>{apps.length}</strong> {apps.length === 1 ? "app disponibile" : "app disponibili"}
            </div>
          </div>

          <div className="app-grid">
            {apps.length === 0 && (
              <div className="empty-state">
                <h2>Il tuo spazio è pronto</h2>
                <p className="muted">Non ci sono ancora app assegnate. Contatta l’amministratore per iniziare.</p>
              </div>
            )}
            {apps.map((app: any) => (
              <article key={app.id} className="card app-card">
                <div className="app-card-visual">
                  <span className="app-initial" aria-hidden="true">{app.name.trim().charAt(0).toLowerCase()}</span>
                  <span className="app-status">Disponibile</span>
                </div>
                <div className="app-card-body">
                  <h2>{app.name}</h2>
                  <p className="muted">{app.description || "Uno strumento del workspace True Design."}</p>
                  <AppLink appId={app.id} url={app.url} userId={user.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
