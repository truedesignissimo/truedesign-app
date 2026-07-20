import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

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
    redirect("/dashboard");
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Amministrazione</h1>
        <a href="/dashboard" className="btn btn-secondary">
          Torna alla dashboard
        </a>
      </div>

      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <a href="/admin/apps" className="btn btn-secondary">App</a>
        <a href="/admin/assignments" className="btn btn-secondary">Assegnazioni</a>
        <a href="/admin/usage" className="btn btn-secondary">Utilizzo</a>
      </nav>

      {children}
    </div>
  );
}
