import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [appsResult, logsResult, usersResult] = await Promise.all([
    supabase.from("apps").select("id, name, is_active, visibility"),
    supabase
      .from("usage_log")
      .select("id, used_at, user_id, apps(name)")
      .order("used_at", { ascending: false })
      .limit(8),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const apps = appsResult.data ?? [];
  const logs = logsResult.data ?? [];
  const users = usersResult.data?.users ?? [];
  const activeApps = apps.filter((app) => app.is_active).length;
  const publicApps = apps.filter((app) => app.visibility === "pubblica" && app.is_active).length;
  const activeUsers = users.filter((user) => user.last_sign_in_at).length;
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  return (
    <div className="admin-section-stack">
      <div className="page-intro admin-overview-intro">
        <div>
          <p className="eyebrow">Extraordinary. Everyday.</p>
          <h1 className="page-title">Pannello di controllo.</h1>
          <p className="lead">Utenti, applicazioni e attività del workspace in un’unica vista.</p>
        </div>
        <span className="admin-live-badge"><i /> Sistema attivo</span>
      </div>

      <section className="admin-metrics-grid" aria-label="Riepilogo piattaforma">
        <a href="/admin/assignments" className="admin-metric-card">
          <span>Utenti registrati</span>
          <strong>{users.length}</strong>
          <small>{activeUsers} hanno già effettuato l’accesso</small>
        </a>
        <a href="/admin/apps" className="admin-metric-card">
          <span>App attive</span>
          <strong>{activeApps}</strong>
          <small>{apps.length} applicazioni nel catalogo</small>
        </a>
        <a href="/admin/apps" className="admin-metric-card">
          <span>App pubbliche</span>
          <strong>{publicApps}</strong>
          <small>Visibili senza autenticazione</small>
        </a>
        <a href="/admin/usage" className="admin-metric-card">
          <span>Accessi registrati</span>
          <strong>{logs.length}</strong>
          <small>Ultima finestra di attività</small>
        </a>
      </section>

      <section className="admin-control-grid">
        <div className="card panel admin-quick-panel">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Gestione</p>
              <h2 className="section-title">Controlli principali</h2>
            </div>
          </div>
          <div className="admin-quick-links">
            <a href="/admin/assignments">
              <span>01</span><div><strong>Utenti e permessi</strong><small>Ruoli, inviti e assegnazioni</small></div><b>→</b>
            </a>
            <a href="/admin/apps">
              <span>02</span><div><strong>Catalogo applicazioni</strong><small>Visibilità, stato e posizione</small></div><b>→</b>
            </a>
            <a href="/admin/usage">
              <span>03</span><div><strong>Utilizzo e accessi</strong><small>Attività per utente e applicazione</small></div><b>→</b>
            </a>
          </div>
        </div>

        <div className="card panel admin-activity-panel">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Live</p>
              <h2 className="section-title">Attività recente</h2>
            </div>
            <a href="/admin/usage" className="text-link">Vedi tutto →</a>
          </div>
          <div className="admin-activity-list">
            {logs.map((log: any) => (
              <div key={log.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{log.apps?.name ?? "Applicazione"}</strong>
                  <small>{emailById.get(log.user_id) ?? "Utente"}</small>
                </div>
                <time>{new Date(log.used_at).toLocaleDateString("it-IT")}</time>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="admin-activity-empty">
                <strong>Nessuna attività registrata</strong>
                <small>I primi accessi alle app compariranno qui.</small>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
