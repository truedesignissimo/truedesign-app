import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export default async function UsagePage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: logs } = await supabase
    .from("usage_log")
    .select("id, used_at, user_id, apps(name)")
    .order("used_at", { ascending: false })
    .limit(200);

  const { data: usersData } = await admin.auth.admin.listUsers();
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);

  // conteggio utilizzi per app
  const countsByApp = new Map<string, number>();
  (logs ?? []).forEach((log: any) => {
    const name = log.apps?.name ?? "—";
    countsByApp.set(name, (countsByApp.get(name) ?? 0) + 1);
  });

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Utilizzi per app</h2>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Numero accessi</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(countsByApp.entries()).map(([name, count]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {countsByApp.size === 0 && <p className="muted">Nessun utilizzo registrato ancora.</p>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Ultimi 200 accessi</h2>
        <table>
          <thead>
            <tr>
              <th>Data/ora</th>
              <th>Utente</th>
              <th>App</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log: any) => (
              <tr key={log.id}>
                <td>{new Date(log.used_at).toLocaleString("it-IT")}</td>
                <td>{emailById.get(log.user_id) ?? log.user_id}</td>
                <td>{log.apps?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
