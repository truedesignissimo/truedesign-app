import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Brand from "../_components/brand";

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
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
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
