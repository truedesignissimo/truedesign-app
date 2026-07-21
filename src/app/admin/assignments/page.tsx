import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import InviteForm from "./invite-form";
import UserAppMatrix from "./user-app-matrix";

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: apps } = await admin
    .from("apps")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const [{ data: userApps }, { data: usersData, error: usersError }, { data: profiles }] =
    await Promise.all([
      admin.from("user_apps").select("user_id, app_id"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id, full_name, is_admin, user_type, approval_status"),
    ]);

  if (usersError) throw new Error(usersError.message);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const users = (usersData?.users ?? []).map((user) => {
    const profile = profileById.get(user.id);
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      is_admin: profile?.is_admin ?? false,
      user_type: profile?.user_type ?? "cliente",
      approval_status: profile?.approval_status ?? "pending",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
    };
  });
  const customerCount = users.filter((user) => user.user_type === "cliente").length;
  const internalCount = users.filter((user) => user.user_type === "interno").length;
  const adminCount = users.filter((user) => user.is_admin).length;
  const pendingCount = users.filter((user) => user.approval_status === "pending").length;

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
        <div className="user-stat-card user-stat-pending">
          <span>Da approvare</span>
          <strong>{pendingCount}</strong>
        </div>
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
            <p className="muted">Gli utenti aggiunti dall’amministratore ricevono subito il link per attivare l’account.</p>
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
