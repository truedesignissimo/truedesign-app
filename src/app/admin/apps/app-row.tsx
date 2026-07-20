"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type App = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  is_active: boolean;
  visibility: string;
};

const VISIBILITY_LABELS: Record<string, string> = {
  interno: "Solo interni",
  cliente: "Clienti",
  pubblica: "Pubblica",
};

export default function AppRow({ app }: { app: App }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggleActive() {
    await supabase.from("apps").update({ is_active: !app.is_active }).eq("id", app.id);
    router.refresh();
  }

  async function changeVisibility(e: React.ChangeEvent<HTMLSelectElement>) {
    await supabase.from("apps").update({ visibility: e.target.value }).eq("id", app.id);
    router.refresh();
  }

  async function deleteApp() {
    if (!confirm(`Eliminare l'app "${app.name}"? Verranno rimosse anche le assegnazioni e i log collegati.`)) {
      return;
    }
    await supabase.from("apps").delete().eq("id", app.id);
    router.refresh();
  }

  return (
    <tr>
      <td>{app.name}</td>
      <td className="muted">{app.url ?? "—"}</td>
      <td>
        <select className="input" value={app.visibility} onChange={changeVisibility}>
          <option value="interno">Solo interni</option>
          <option value="cliente">Clienti</option>
          <option value="pubblica">Pubblica</option>
        </select>
      </td>
      <td>
        <button className="btn btn-secondary" onClick={toggleActive}>
          {app.is_active ? "Attiva" : "In pausa"}
        </button>
      </td>
      <td>
        <button className="btn btn-danger" onClick={deleteApp}>
          Elimina
        </button>
      </td>
    </tr>
  );
}
