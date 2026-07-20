"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type App = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  is_active: boolean;
};

export default function AppRow({ app }: { app: App }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggleActive() {
    await supabase.from("apps").update({ is_active: !app.is_active }).eq("id", app.id);
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
        <button className="btn btn-secondary" onClick={toggleActive}>
          {app.is_active ? "Sì" : "No"}
        </button>
      </td>
      <td>
        <button className="btn btn-secondary" onClick={deleteApp}>
          Elimina
        </button>
      </td>
    </tr>
  );
}
