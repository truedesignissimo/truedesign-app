import { createAdminClient } from "@/lib/supabase-admin";
import { buildUsageReport } from "@/lib/usage-report";
import UsageCharts, { type UsageDatum } from "./usage-charts";

export default async function UsagePage() {
  const admin = createAdminClient();

  const [usageResult, accessResult, usersResult, profilesResult] =
    await Promise.all([
      admin
        .from("usage_log")
        .select("id, used_at, user_id, apps(id, name)")
        .order("used_at", { ascending: false })
        .limit(5000),
      admin
        .from("access_log")
        .select("id, accessed_at, user_id, source")
        .order("accessed_at", { ascending: false })
        .limit(5000),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id, full_name"),
    ]);

  const errors = [
    usageResult.error ? "Le aperture delle app non sono disponibili." : null,
    accessResult.error ? "Lo storico degli accessi al workspace non è disponibile." : null,
    usersResult.error ? "L’elenco utenti non è disponibile." : null,
    profilesResult.error ? "I nomi dei profili non sono disponibili." : null,
  ].filter(Boolean) as string[];

  const usageLogs = (usageResult.data ?? []).map((log: any) => ({
    ...log,
    apps: Array.isArray(log.apps) ? log.apps[0] ?? null : log.apps,
  }));
  const accessLogs = accessResult.data ?? [];
  const report = buildUsageReport({
    accessLogs,
    usageLogs,
    users: usersResult.data?.users ?? [],
    profiles: profilesResult.data ?? [],
  });

  const today = new Date();
  const daily: UsageDatum[] = Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (29 - offset));
    return {
      label: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
      }).format(date),
      detail: date.toISOString().slice(0, 10),
      value: 0,
    };
  });
  const dailyByKey = new Map(daily.map((item) => [item.detail, item]));
  usageLogs.forEach((log: any) => {
    const item = dailyByKey.get(
      new Date(log.used_at).toISOString().slice(0, 10)
    );
    if (item) item.value += 1;
  });

  const byUser: UsageDatum[] = report.appUsers.map((item) => ({
    label: item.label,
    detail: item.email,
    value: item.value,
  }));

  return (
    <div className="admin-section-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="page-title">Utilizzo.</h1>
          <p className="lead">
            Accessi al workspace e aperture delle applicazioni, senza
            confondere i due eventi.
          </p>
        </div>
        <div className="stat-pill">
          <strong>{report.totalAppOpens}</strong> aperture app
        </div>
      </div>

      {errors.length > 0 && (
        <div className="error" role="alert">
          <strong>Report parzialmente disponibile.</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <section className="analytics-kpi-grid" aria-label="Indicatori di utilizzo">
        <div><span>Login workspace</span><strong>{report.totalLogins}</strong></div>
        <div><span>Utenti con login</span><strong>{report.loginUsers.length}</strong></div>
        <div><span>Aperture app</span><strong>{report.totalAppOpens}</strong></div>
        <div><span>Utenti sulle app</span><strong>{report.appUsers.length}</strong></div>
      </section>

      <UsageCharts daily={daily} byApp={report.byApp} byUser={byUser} />

      <section className="card panel analytics-table-panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Accessi al workspace</h2>
            <p className="muted">Ogni autenticazione completata con successo.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data e ora</th><th>Utente</th><th>Email</th><th>Origine</th></tr>
            </thead>
            <tbody>
              {report.recentLogins.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.accessed_at).toLocaleString("it-IT")}</td>
                  <td>{log.label}</td>
                  <td>{log.email ?? "—"}</td>
                  <td>{log.source === "homepage" ? "Homepage" : "Pagina accesso"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.recentLogins.length === 0 && (
          <p className="muted">Nessun login ancora registrato.</p>
        )}
      </section>

      <section className="card panel analytics-table-panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Dettaglio utilizzo app</h2>
            <p className="muted">
              Aperture complessive per utente, escluse anteprime e prefetch.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Utente</th><th>Email</th><th>Aperture</th><th>Incidenza</th></tr>
            </thead>
            <tbody>
              {report.appUsers.map((item) => (
                <tr key={item.userId}>
                  <td>{item.label}</td>
                  <td>{item.email ?? "—"}</td>
                  <td>{item.value}</td>
                  <td>
                    {report.totalAppOpens
                      ? `${Math.round((item.value / report.totalAppOpens) * 100)}%`
                      : "0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.appUsers.length === 0 && (
          <p className="muted">Nessuna apertura app registrata.</p>
        )}
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Aperture delle app</h2>
            <p className="muted">Le navigazioni applicazione più recenti.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data e ora</th><th>Utente</th><th>Applicazione</th></tr>
            </thead>
            <tbody>
              {report.recentAppOpens.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.used_at).toLocaleString("it-IT")}</td>
                  <td>{log.label}</td>
                  <td>{log.appName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
