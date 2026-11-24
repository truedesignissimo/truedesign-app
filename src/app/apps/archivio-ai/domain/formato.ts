import type { ImmagineArchivio, Riconoscimento } from "../data/tipi";

export const SOGLIA = 0.7;

export function percentuale(accuratezza: number | null): string {
  if (accuratezza === null || !Number.isFinite(accuratezza)) return "—";
  return `${Math.round(accuratezza * 100)}%`;
}

export function peso(byte: number | null): string {
  if (!byte || byte <= 0) return "";
  if (byte < 1024 * 1024) return `${Math.max(1, Math.round(byte / 1024))} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function dimensioni(immagine: Pick<ImmagineArchivio, "larghezza" | "altezza">): string {
  if (!immagine.larghezza || !immagine.altezza) return "";
  return `${immagine.larghezza} × ${immagine.altezza} px`;
}

export function dataBreve(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" });
}

/** Il riconoscimento con l'accuratezza più alta: è quello che dà il nome alla foto. */
export function riconoscimentoTop(immagine: Pick<ImmagineArchivio, "principale" | "secondario">): Riconoscimento {
  const principale = immagine.principale.accuratezza ?? 0;
  const secondario = immagine.secondario.accuratezza ?? 0;
  return secondario > principale ? immagine.secondario : immagine.principale;
}

/** "Abisko-Divano" nella collezione Abisko diventa "Divano": il prodotto senza la collezione davanti. */
export function nomeProdotto(riconoscimento: Riconoscimento): string {
  const prodotto = (riconoscimento.prodotto ?? "").trim();
  const collezione = (riconoscimento.collezione ?? "").trim();
  if (collezione && prodotto.toLowerCase().startsWith(`${collezione.toLowerCase()}-`)) {
    return prodotto.slice(collezione.length + 1).trim();
  }
  return prodotto;
}

/** Seconda riga sotto la foto nella griglia: il prodotto, oppure che cosa si vede. */
export function dettaglioCarta(immagine: Pick<ImmagineArchivio, "principale" | "secondario" | "tipologie" | "nomeShooting">): string {
  const top = riconoscimentoTop(immagine);
  const prodotto = nomeProdotto(top);
  if (prodotto && prodotto.toLowerCase() !== (top.collezione ?? "").toLowerCase()) return prodotto;
  if (immagine.tipologie.length) return immagine.tipologie.slice(0, 3).join(", ");
  return immagine.nomeShooting;
}

export function correttaAMano(immagine: Pick<ImmagineArchivio, "principale" | "principaleAi">): boolean {
  return (immagine.principale.prodotto ?? "") !== (immagine.principaleAi.prodotto ?? "");
}

export function etichettaStato(immagine: Pick<ImmagineArchivio, "stato" | "sopraSoglia">): string {
  if (immagine.stato === "approvata") return "Approvata";
  if (immagine.stato === "nascosta") return "Nascosta";
  return immagine.sopraSoglia ? "Automatica" : "Da rivedere";
}

export function nomeFileSicuro(nome: string): string {
  const pulito = nome.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").trim();
  return pulito || "immagine";
}
