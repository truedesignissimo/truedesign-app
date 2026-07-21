import { createAdminClient } from "@/lib/supabase-admin";
import NewAppForm from "./new-app-form";
import AppRow from "./app-row";

export default async function AdminAppsPage() {
  const admin = createAdminClient();

  const placementResult = await admin
    .from("apps")
    .select("id, name, description, url, is_active, visibility, is_featured, display_order")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const supportsPlacement = !placementResult.error;
  const fallbackResult = supportsPlacement
    ? null
    : await admin
        .from("apps")
        .select("id, name, description, url, is_active, visibility")
        .order("created_at", { ascending: false });

  const apps = supportsPlacement
    ? placementResult.data
    : (fallbackResult?.data ?? []).map((app) => ({ ...app, is_featured: false, display_order: 0 }));

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
        {!supportsPlacement && (
          <p className="admin-schema-notice">
            La gestione di posizione e ordine sarà disponibile dopo l’applicazione della migrazione catalogo Supabase.
          </p>
        )}
        <NewAppForm supportsPlacement={supportsPlacement} />
      </section>

      <section className="card panel">
        <div className="admin-section-heading">
          <div>
            <h2 className="section-title">Catalogo</h2>
            <p className="muted">Modifica visibilità e stato delle applicazioni già registrate.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="app-catalog-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Indirizzo</th>
                <th>Visibilità</th>
                <th>Posizione</th>
                <th>Ordine</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {(apps ?? []).map((app) => <AppRow key={app.id} app={app} supportsPlacement={supportsPlacement} />)}
            </tbody>
          </table>
        </div>
        {(apps ?? []).length === 0 && <p className="muted">Nessuna applicazione creata.</p>}
      </section>
    </div>
  );
}
