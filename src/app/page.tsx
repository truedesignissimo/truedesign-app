import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 600, display: "flex", alignItems: "center", minHeight: "80vh" }}>
      <div style={{ width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", margin: 0 }}>True App</h1>
          <p className="muted">Piattaforma web app di True Design</p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <a href="/login?tipo=cliente" className="card" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            <strong style={{ fontSize: "1.1rem" }}>Sono un cliente</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Accedi alle app riservate ai clienti</p>
          </a>
          <a href="/login?tipo=interno" className="card" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            <strong style={{ fontSize: "1.1rem" }}>Sono di True Design</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Accedi come utente interno</p>
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/pubblico" className="muted" style={{ fontSize: "0.9rem" }}>
            Oppure sfoglia le app pubbliche, senza accesso →
          </a>
        </div>
      </div>
    </div>
  );
}
