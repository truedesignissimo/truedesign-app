import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Brand from "../_components/brand";

const DEFAULT_OWNER_EMAIL = "dario.breggie@truedesign.it";

function getOwnerEmails() {
  return (process.env.INITIAL_ADMIN_EMAILS ?? DEFAULT_OWNER_EMAIL)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name, user_type, approval_status")
    .eq("id", user.id)
    .single();

  let isAdmin = profile?.is_admin ?? false;

  if (profile?.approval_status === "pending" || profile?.approval_status === "rejected") {
    redirect("/in-attesa");
  }

  if (!isAdmin && user.email && getOwnerEmails().includes(user.email.toLowerCase())) {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name:
          profile?.full_name ??
          user.user_metadata?.full_name ??
          user.email.split("@")[0],
        user_type: "interno",
        is_admin: true,
        approval_status: "approved",
        approved_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    isAdmin = !error;
  }

  if (!isAdmin) {
    redirect("/accesso-negato");
  }

  return (
    <main className="page-shell">
      <div className="container">
        <header className="admin-header">
          <div className="site-header">
            <Brand context="amministrazione" />
            <a href="/dashboard" className="btn btn-secondary">← Dashboard</a>
          </div>

          <nav className="admin-nav" aria-label="Navigazione amministrazione">
            <a href="/admin" className="btn btn-secondary">Panoramica</a>
            <a href="/admin/apps" className="btn btn-secondary">Applicazioni</a>
            <a href="/admin/assignments" className="btn btn-secondary">Utenti</a>
            <a href="/admin/usage" className="btn btn-secondary">Utilizzo</a>
          </nav>
        </header>

        <div className="admin-main">{children}</div>
      </div>
    </main>
  );
}
