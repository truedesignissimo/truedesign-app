import { createAdminClient } from "@/lib/supabase-admin";
import UsageCharts, { type UsageDatum } from "./usage-charts";

export default async function UsagePage() {
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("usage_log")
    .select("id, used_at, user_id, apps(id, name)")
    .order("used_at", { ascending: false })
    .limit(5000);

  const [{ data: usersData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, full_name"),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);

  const countsByApp = new Map<string, number>();
  const countsByUser = new Map<string, number>();
  (logs ?? []).forEach((log: any) => {
    const name = log.apps?.name ?? "—";
    countsByApp.set(name, (countsByApp.get(name) ?? 0) + 1);
    countsByUser.set(log.user_id, (countsByUser.get(log.user_id) ?? 0) + 1);
  });

  const today = new Date();
  const daily: UsageDatum[] = Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (29 - offset));
    return {
      label: new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(date),
      detail: date.toISOString().slice(0, 10),
      value: 0,
    };
  });
  const dailyByKey = new Map(daily.map((item) => [item.detail, item]));
  (logs ?? []).forEach((log: any) => {
    const key = new Date(log.used_at).toISOString().slice(0, 10);
    const item = dailyByKey.get(key);
    if (item) item.value += 1;
  });

  const byApp: UsageDatum[] = Array.from(countsByApp.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const byUser: UsageDatum[] = Array.from(countsByUser.entries())
    .map(([userId, value]) => ({
      label: profileById.get(userId) || emailById.get(userId) || "Utente",
      detail: emailById.get(userId),
      value,
    }))
    .sort((a, b) => b.value - a.value);
  const uniqueUsers = countsByUser.size;
  const activeApps = countsByApp.size;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayUses = (logs ?? []).filter((log: any) => new Date(log.used_at).toISOString().slice(0, 10) === todayKey).length;

  return (
    <div className="admin-section-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="page-title">Utilizzo.</h1>
          <p className="lead">Analisi completa dell’attività per applicazione, utente e periodo.</p>
        </div>
        <div className="stat-pill"><strong>{(logs ?? []).length}</strong> accessi registrati</div>
      </div>

      <section className="analytics-kpi-grid" aria-label="Indicatori di utilizzo">
        <div><span>Accessi totali</span><strong>{(logs ?? []).length}</strong></div>
        <div><span>Utenti attivi</span><strong>{uniqueUsers}</strong></div>
        <div><span>App utilizzate</span><strong>{activeApps}</strong></div>
        <div><span>Accessi oggi</span><strong>{todayUses}</strong></div>
      </section>

      <UsageCharts daily={daily} byApp={byApp} byUser={byUser} />

      <section className="card panel analytics-table-panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Dettaglio per utente</h2>
            <p className="muted">Confronto tra utenti e numero complessivo di aperture.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Utente</th><th>Email</th><th>Accessi</th><th>Incidenza</th></tr></thead>
            <tbody>
              {byUser.map((item) => (
                <tr key={`${item.label}-${item.detail}`}>
                  <td>{item.label}</td><td>{item.detail ?? "—"}</td><td>{item.value}</td>
                  <td>{(logs ?? []).length ? `${Math.round((item.value / (logs ?? []).length) * 100)}%` : "0%"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {byUser.length === 0 && <p className="muted">Nessun utilizzo registrato.</p>}
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
