import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import SignOutButton from "./sign-out-button";
import AppLink from "./app-link";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  const { data: userApps } = await supabase
    .from("user_apps")
    .select("apps(id, name, description, url)")
    .eq("user_id", user.id);

  const apps = (userApps ?? [])
    .map((row: any) => row.apps)
    .filter(Boolean);

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
          <p className="muted">Nessuna app assegnata al momento. Contatta l'amministratore.</p>
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
