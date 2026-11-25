import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { rispondiOriginale } from "../domain/originale";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// GET /apps/archivio-ai/originale?id=<id_drive> — scarica il file originale da Drive.
// La foto viene cercata con la sessione dell'utente: il database mostra a ciascuno
// solo le foto che può vedere, quindi per le altre la risposta è "non trovata".
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  return rispondiOriginale(request.nextUrl.searchParams.get("id"), {
    servizioUrl: process.env.ARCHIVIO_AI_ORIGINALI_URL,
    segreto: process.env.ARCHIVIO_AI_SECRET,
    async trovaImmagine(idDrive) {
      const { data, error } = await supabase
        .from("archivio_immagini")
        .select("id_drive, nome_file")
        .eq("id_drive", idDrive)
        .maybeSingle();
      if (error || !data) return null;
      return { idDrive: String(data.id_drive), nomeFile: String(data.nome_file ?? "") };
    },
  });
}
