import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "../_components/brand";
import SignOutButton from "../dashboard/sign-out-button";

export default async function PendingApprovalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.approval_status === "approved") redirect("/dashboard");

  return (
    <main className="page-shell pending-page">
      <div className="container pending-layout">
        <header className="site-header">
          <Brand context="richiesta di accesso" />
          <SignOutButton />
        </header>
        <section className="pending-card card">
          <p className="eyebrow">Registrazione ricevuta</p>
          <h1 className="page-title">La tua richiesta è in approvazione.</h1>
          <p className="lead">
            Ciao{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Il tuo account è stato
            creato correttamente. Riceverai accesso appena l’amministratore avrà approvato il profilo
            e assegnato le applicazioni disponibili per te.
          </p>
          <p className="muted">Account: {user.email}</p>
        </section>
      </div>
    </main>
  );
}
