import { createClient } from "@/lib/supabase-server";
import { listUsersWithProfiles } from "./actions";
import InviteForm from "./invite-form";
import UserAppMatrix from "./user-app-matrix";

export default async function AssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: userApps } = await supabase.from("user_apps").select("user_id, app_id");
  const users = await listUsersWithProfiles();
  const customerCount = users.filter((user) => user.user_type === "cliente").length;
  const internalCount = users.filter((user) => user.user_type === "interno").length;
  const adminCount = users.filter((user) => user.is_admin).length;

  return (
    <div className="admin-section-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Accessi</p>
          <h1 className="page-title">Utenti.</h1>
          <p className="lead">Gestisci profili, ruoli ed eccezioni da un unico punto.</p>
        </div>
        <div className="stat-pill"><strong>{users.length}</strong> utenti totali</div>
      </div>

      <div className="user-stats-grid" aria-label="Riepilogo utenti">
        <div className="user-stat-card">
          <span>Clienti</span>
          <strong>{customerCount}</strong>
        </div>
        <div className="user-stat-card">
          <span>Team interno</span>
          <strong>{internalCount}</strong>
        </div>
        <div className="user-stat-card">
          <span>Amministratori</span>
          <strong>{adminCount}</strong>
        </div>
      </div>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Aggiungi un utente</h2>
            <p className="muted">Scegli subito il tipo di profilo. Riceverà via email il link per attivare l’account.</p>
          </div>
        </div>
        <InviteForm />
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Pannello utenti</h2>
            <p className="muted">
              Cerca un profilo, modifica il ruolo e gestisci le app assegnate. Le modifiche vengono
              salvate direttamente in Supabase.
            </p>
          </div>
        </div>
        <UserAppMatrix
          users={users}
          apps={apps ?? []}
          userApps={userApps ?? []}
          currentUserId={currentUser?.id ?? ""}
        />
      </section>
    </div>
  );
}
