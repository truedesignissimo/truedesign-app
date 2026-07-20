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
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Utenti e app assegnate</h2>
        <UserAppMatrix
          users={users}
          apps={apps ?? []}
          userApps={userApps ?? []}
        />
      </div>
    </div>
  );
}
