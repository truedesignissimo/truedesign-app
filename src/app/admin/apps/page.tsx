import { createClient } from "@/lib/supabase-server";
import NewAppForm from "./new-app-form";
import AppRow from "./app-row";

export default async function AdminAppsPage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("id, name, description, url, is_active, visibility")
    .order("created_at", { ascending: false });

  return (
    <div className="admin-section-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h1 className="page-title">Applicazioni.</h1>
          <p className="lead">Crea, pubblica e organizza gli strumenti del workspace.</p>
        </div>
        <div className="stat-pill"><strong>{(apps ?? []).length}</strong> totali</div>
      </div>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Nuova applicazione</h2>
            <p className="muted">Collega una nuova app e scegli subito chi può utilizzarla.</p>
          </div>
        </div>
        <NewAppForm />
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Catalogo</h2>
            <p className="muted">Modifica visibilità e stato delle applicazioni già registrate.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Indirizzo</th>
                <th>Visibilità</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {(apps ?? []).map((app) => <AppRow key={app.id} app={app} />)}
            </tbody>
          </table>
        </div>
        {(apps ?? []).length === 0 && <p className="muted">Nessuna applicazione creata.</p>}
      </section>
    </div>
  );
}
