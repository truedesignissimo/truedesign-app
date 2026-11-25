import { nomeFileSicuro } from "./formato";

export interface ImmagineOriginale {
  idDrive: string;
  nomeFile: string;
}

export interface OriginaleDeps {
  /** Cerca la foto con i permessi dell'utente: chi non è admin non trova nulla. */
  trovaImmagine(idDrive: string): Promise<ImmagineOriginale | null>;
  /** Indirizzo del servizio protetto che scarica da Drive (flusso n8n). Vuoto = non configurato. */
  servizioUrl?: string;
  segreto?: string;
  fetch?: typeof fetch;
  logger?: (errore: unknown) => void;
}

const ID_DRIVE = /^[A-Za-z0-9_-]{10,100}$/;
const NON_DISPONIBILE = "Il file originale non è disponibile in questo momento. Riprova tra poco.";

const json = (stato: number, errore: string) =>
  new Response(JSON.stringify({ ok: false, errore }), {
    status: stato,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export const linkDrive = (idDrive: string) => `https://drive.google.com/file/d/${idDrive}/view`;

/**
 * Scarica il file originale di una foto dell'archivio.
 * Con il servizio configurato il file passa dal server (l'utente non ha bisogno di accesso a Drive);
 * senza, rimanda alla pagina del file su Drive.
 */
export async function rispondiOriginale(idRichiesto: string | null, deps: OriginaleDeps): Promise<Response> {
  const idDrive = (idRichiesto ?? "").trim();
  if (!ID_DRIVE.test(idDrive)) return json(400, "Identificativo della foto non valido.");

  const immagine = await deps.trovaImmagine(idDrive);
  if (!immagine) return json(404, "Foto non trovata in archivio.");

  const servizioUrl = (deps.servizioUrl ?? "").trim();
  const segreto = (deps.segreto ?? "").trim();
  if (!servizioUrl || !segreto) {
    return new Response(null, {
      status: 302,
      headers: { Location: linkDrive(immagine.idDrive), "Cache-Control": "no-store" },
    });
  }

  const registra = deps.logger ?? console.error;
  try {
    const risposta = await (deps.fetch ?? fetch)(servizioUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-archivio-ai-secret": segreto },
      body: JSON.stringify({ id_drive: immagine.idDrive }),
      cache: "no-store",
    });
    const tipo = risposta.headers.get("content-type") ?? "";
    if (!risposta.ok || !risposta.body || tipo.includes("application/json")) {
      registra(`[archivio-ai] originale non scaricato: HTTP ${risposta.status}`);
      return json(502, NON_DISPONIBILE);
    }

    const nome = nomeFileSicuro(immagine.nomeFile);
    const nomeAscii = nome.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "_");
    const intestazioni = new Headers({
      "Content-Type": tipo || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${nomeAscii}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const lunghezza = risposta.headers.get("content-length");
    if (lunghezza) intestazioni.set("Content-Length", lunghezza);
    return new Response(risposta.body, { status: 200, headers: intestazioni });
  } catch (errore) {
    registra(errore);
    return json(502, NON_DISPONIBILE);
  }
}
