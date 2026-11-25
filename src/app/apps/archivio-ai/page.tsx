import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ArchivioAi } from "./archivio-ai";

export const metadata: Metadata = {
  title: "Archivio immagini",
  description: "Le foto degli shooting True Design: cerca, guarda e scarica.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Tutti gli utenti approvati cercano e scaricano le foto visibili.
// Chi ha il flag `is_admin` vede in più l'area di revisione: è l'unica cosa che distingue le due viste.
export default async function ArchivioAiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profilo } = await supabase
    .from("profiles")
    .select("is_admin, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profilo?.approval_status === "pending" || profilo?.approval_status === "rejected") redirect("/in-attesa");
  if (profilo?.approval_status !== "approved") redirect("/accesso-negato?motivo=app");

  const originaliDallApp = Boolean(process.env.ARCHIVIO_AI_ORIGINALI_URL?.trim() && process.env.ARCHIVIO_AI_SECRET?.trim());

  return <ArchivioAi ruolo={profilo.is_admin ? "admin" : "utente"} originaliDallApp={originaliDallApp} />;
}
