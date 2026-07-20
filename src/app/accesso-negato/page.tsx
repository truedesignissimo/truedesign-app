import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Brand from "../_components/brand";
import SignOutButton from "../dashboard/sign-out-button";

export default async function AccessDeniedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?tipo=interno");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) redirect("/admin");

  const roleLabel = profile?.user_type === "interno" ? "Team interno" : "Cliente";

  return (
    <main className="page-shell access-denied-page">
      <div className="container">
        <header className="site-header dashboard-header">
          <Brand context="accesso" />
          <a href="/" className="btn btn-secondary">Home</a>
        </header>

        <section className="access-denied-layout">
          <div className="access-denied-mark" aria-hidden="true">!</div>
          <div className="access-denied-content">
            <p className="eyebrow">Permessi account</p>
            <h1 className="page-title">Questo profilo non è amministratore.</h1>
            <p className="lead">
              L’area di controllo è attiva, ma l’account collegato non ha il permesso
              necessario. Per sicurezza non vieni più rimandato silenziosamente alla dashboard.
            </p>

            <div className="account-detail-card">
              <div>
                <span>Account collegato</span>
                <strong>{user.email ?? "Email non disponibile"}</strong>
              </div>
              <div>
                <span>Profilo corrente</span>
                <strong>{roleLabel}</strong>
              </div>
              <div>
                <span>Accesso admin</span>
                <strong>Non abilitato</strong>
              </div>
            </div>

            <div className="access-denied-actions">
              <SignOutButton />
              <a href="/dashboard" className="btn btn-secondary">Torna alla dashboard</a>
            </div>
            <p className="muted access-denied-help">
              Esci e accedi con l’account amministratore. Se questa è l’email corretta,
              il profilo deve essere abilitato come amministratore in Supabase.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
