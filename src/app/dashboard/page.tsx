import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "../_components/brand";
import SignOutButton from "./sign-out-button";
import AppLink from "./app-link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, full_name, user_type, approval_status")
    .eq("id", user.id)
    .single();

  if (profile?.approval_status === "pending" || profile?.approval_status === "rejected") {
    redirect("/in-attesa");
  }

  let visibleApps: any[] = [];

  if (profile?.is_admin) {
    const catalogResult = await admin
      .from("apps")
      .select("id, name, description, url, is_active, is_featured, display_order")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (catalogResult.error) {
      const fallback = await admin
        .from("apps")
        .select("id, name, description, url, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });
      visibleApps = (fallback.data ?? []).map((app) => ({
        ...app,
        is_featured: false,
        display_order: 0,
      }));
    } else {
      visibleApps = catalogResult.data ?? [];
    }
  }

  let { data: userApps, error: assignedAppsError } = await supabase
    .from("user_apps")
    .select("apps(id, name, description, url, is_active, is_featured, display_order)")
    .eq("user_id", user.id);

  if (assignedAppsError) {
    const fallbackAssigned = await supabase
      .from("user_apps")
      .select("apps(id, name, description, url, is_active)")
      .eq("user_id", user.id);
    userApps = (fallbackAssigned.data ?? []).map((row: any) => ({
      apps: row.apps ? { ...row.apps, is_featured: false, display_order: 0 } : null,
    })) as any;
  }

  const assignedApps = (userApps ?? [])
    .map((row: any) => row.apps)
    .filter((app: any) => app?.is_active);

  const appsById = new Map<string, any>();
  const availableApps = profile?.is_admin ? visibleApps : assignedApps;
  availableApps.forEach((app) => {
    if (app) appsById.set(app.id, app);
  });
  const apps = Array.from(appsById.values()).sort((first, second) =>
    Number(Boolean(second.is_featured)) - Number(Boolean(first.is_featured)) ||
    (first.display_order ?? 0) - (second.display_order ?? 0) ||
    first.name.localeCompare(second.name, "it")
  );

  return (
    <main className="page-shell">
      <div className="container">
        <header className="site-header dashboard-header">
          <Brand />
          <div className="header-actions">
            {profile?.is_admin && (
              <>
                <a href="/" className="btn btn-secondary">Home</a>
                <a href="/admin" className="btn btn-secondary">Amministrazione</a>
              </>
            )}
            <SignOutButton />
          </div>
        </header>

        <section className="dashboard-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">
                {profile?.is_admin ? "Profilo amministratore" : "Extraordinary. Everyday."}
              </p>
              <h1 className="page-title">
                {profile?.is_admin ? `Ciao${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.` : "Le tue app."}
              </h1>
              <p className="lead">
                {profile?.is_admin
                  ? "Tutto quello che ti serve, pronto da aprire."
                  : "Qui trovi esclusivamente gli strumenti che ti sono stati assegnati."}
              </p>
              {profile?.is_admin && <p className="account-email">{user.email}</p>}
            </div>
            <div className="stat-pill">
              <strong>{apps.length}</strong> {apps.length === 1 ? "app disponibile" : "app disponibili"}
            </div>
          </div>

          <div className="app-grid">
            {apps.length === 0 && (
              <div className="empty-state">
                <h2>Nessuna app assegnata</h2>
                <p className="muted">Quando l’amministratore assegnerà uno strumento al tuo profilo, comparirà qui.</p>
                {profile?.is_admin && (
                  <div className="empty-state-actions">
                    <a href="/admin/apps" className="btn">Gestisci il catalogo</a>
                  </div>
                )}
              </div>
            )}
            {apps.map((app: any) => (
              <article key={app.id} className={`card app-card ${app.is_featured ? "app-card-featured" : ""}`}>
                <div className="app-card-visual">
                  <span className="app-initial" aria-hidden="true">{app.name.trim().charAt(0).toLowerCase()}</span>
                  <span className="app-status">{app.is_featured ? "In evidenza" : "Disponibile"}</span>
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
