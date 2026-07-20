import { createClient } from "@/lib/supabase-server";
import NewAppForm from "./new-app-form";
import AppRow from "./app-row";

export default async function AdminAppsPage() {
  const supabase = createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name, description, url, is_active, visibility")
    .order("created_at", { ascending: false });

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Nuova app</h2>
        <NewAppForm />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>App esistenti</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>URL</th>
              <th>Visibile a</th>
              <th>Attiva</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(apps ?? []).map((app) => (
              <AppRow key={app.id} app={app} />
            ))}
          </tbody>
        </table>
        {(apps ?? []).length === 0 && <p className="muted">Nessuna app creata.</p>}
      </div>
    </div>
  );
}
