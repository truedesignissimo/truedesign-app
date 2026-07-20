import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
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

  // App visibili per via del tipo di utente (o tutte se admin)
  let visibilityQuery = supabase
    .from("apps")
    .select("id, name, description, url")
    .eq("is_active", true);

  if (!profile?.is_admin) {
    const visibleTypes = ["pubblica", profile?.user_type ?? "cliente"];
    visibilityQuery = visibilityQuery.in("visibility", visibleTypes);
  }

  const { data: visibleApps } = await visibilityQuery;

  // App assegnate singolarmente (oltre a quelle di categoria)
  const { data: userApps } = await supabase
    .from("user_apps")
    .select("apps(id, name, description, url)")
    .eq("user_id", user.id);

  const assignedApps = (userApps ?? [])
    .map((row: any) => row.apps)
    .filter(Boolean);

  // Unione senza duplicati
  const appsById = new Map<string, any>();
  [...(visibleApps ?? []), ...assignedApps].forEach((app) => {
    if (app) appsById.set(app.id, app);
  });
  const apps = Array.from(appsById.values());

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
            Ciao{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="muted">Le tue app</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {profile?.is_admin && (
            <a href="/admin" className="btn btn-secondary">
              Area admin
            </a>
          )}
          <SignOutButton />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginTop: "1.5rem" }}>
        {apps.length === 0 && (
          <p className="muted">Nessuna app disponibile al momento. Contatta l'amministratore.</p>
        )}
        {apps.map((app: any) => (
          <div key={app.id} className="card app-card">
            <strong>{app.name}</strong>
            {app.description && <span className="muted">{app.description}</span>}
            <AppLink appId={app.id} url={app.url} userId={user.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
