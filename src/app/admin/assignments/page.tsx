import { createClient } from "@/lib/supabase-server";
import { listUsersWithProfiles } from "./actions";
import InviteForm from "./invite-form";
import UserAppMatrix from "./user-app-matrix";

export default async function AssignmentsPage() {
  const supabase = createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: userApps } = await supabase.from("user_apps").select("user_id, app_id");

  const users = await listUsersWithProfiles();

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Invita nuovo utente</h2>
        <InviteForm />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Utenti, tipo di accesso ed eccezioni</h2>
        <p className="muted" style={{ marginTop: "-0.5rem" }}>
          Il tipo (Cliente/Interno) determina automaticamente quali app vede ciascun utente.
          Le caselle a destra servono solo per assegnare un'app specifica a un singolo utente
          fuori dalla sua categoria.
        </p>
        <UserAppMatrix
          users={users}
          apps={apps ?? []}
          userApps={userApps ?? []}
        />
      </div>
    </div>
  );
}
