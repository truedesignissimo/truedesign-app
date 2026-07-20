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

  const countsByApp = new Map<string, number>();
  (logs ?? []).forEach((log: any) => {
    const name = log.apps?.name ?? "—";
    countsByApp.set(name, (countsByApp.get(name) ?? 0) + 1);
  });

  return (
    <div className="admin-section-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="page-title">Utilizzo.</h1>
          <p className="lead">Una vista essenziale su quali strumenti vengono usati.</p>
        </div>
        <div className="stat-pill"><strong>{(logs ?? []).length}</strong> accessi recenti</div>
      </div>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Accessi per applicazione</h2>
            <p className="muted">Conteggio calcolato sugli ultimi 200 eventi registrati.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Applicazione</th><th>Numero accessi</th></tr></thead>
            <tbody>
              {Array.from(countsByApp.entries()).map(([name, count]) => (
                <tr key={name}><td>{name}</td><td>{count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {countsByApp.size === 0 && <p className="muted">Nessun utilizzo registrato.</p>}
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Attività recente</h2>
            <p className="muted">Gli ultimi accessi in ordine cronologico.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data e ora</th><th>Utente</th><th>Applicazione</th></tr></thead>
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
      </section>
    </div>
  );
}
