import { Zip, ZipPassThrough } from "fflate";
import { nomeFileSicuro } from "./formato";

/** Quante foto si possono mettere in uno ZIP: gli originali pesano, quindi il limite è più basso. */
export const MAX_ORIGINALI = 25;
export const MAX_LEGGERE = 100;

export interface VoceZip {
  nome: string;
  carica(): Promise<Uint8Array>;
}

export interface EsitoZip {
  blob: Blob;
  incluse: number;
  /** Nomi dei file che non è stato possibile scaricare. */
  fallite: string[];
}

interface OpzioniZip {
  onProgresso?(fatte: number, totale: number): void;
  segnale?: AbortSignal;
  /** Download contemporanei: pochi, per non farsi rifiutare le richieste dallo storage. */
  insieme?: number;
}

export class DownloadAnnullato extends Error {
  constructor() {
    super("Download annullato");
    this.name = "DownloadAnnullato";
  }
}

/** Rende unici i nomi dentro lo ZIP: il secondo "foto.jpg" diventa "foto (2).jpg". */
export function nomiUnici(nomi: string[]): string[] {
  const usati = new Map<string, number>();
  return nomi.map((grezzo) => {
    const nome = nomeFileSicuro(grezzo);
    const chiave = nome.toLowerCase();
    const volte = (usati.get(chiave) ?? 0) + 1;
    usati.set(chiave, volte);
    if (volte === 1) return nome;
    const punto = nome.lastIndexOf(".");
    return punto > 0 ? `${nome.slice(0, punto)} (${volte})${nome.slice(punto)}` : `${nome} (${volte})`;
  });
}

/** Nome della versione leggera: stesso nome dell'originale, sempre in JPEG. */
export function nomeVersioneLeggera(nomeFile: string): string {
  const nome = nomeFileSicuro(nomeFile).replace(/\.[A-Za-z0-9]{2,5}$/, "");
  return `${nome}.jpg`;
}

export function nomeZip(tipo: "leggere" | "originali", adesso = new Date()): string {
  const giorno = adesso.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  return `true-design-foto-${tipo === "originali" ? "originali" : "leggere"}-${giorno}.zip`;
}

/**
 * Scarica i file e li mette in uno ZIP senza comprimerli (le foto lo sono già).
 * Un file che non si scarica non blocca gli altri: viene elencato tra i falliti.
 */
export async function creaZip(voci: VoceZip[], opzioni: OpzioniZip = {}): Promise<EsitoZip> {
  const { onProgresso, segnale, insieme = 3 } = opzioni;
  const nomi = nomiUnici(voci.map((voce) => voce.nome));
  const parti: Uint8Array[] = [];
  const fallite: string[] = [];
  let incluse = 0;
  let fatte = 0;
  let prossima = 0;

  let zip!: Zip;
  const chiuso = new Promise<void>((risolvi, rifiuta) => {
    zip = new Zip((errore, pezzo, finale) => {
      if (errore) {
        rifiuta(errore);
        return;
      }
      parti.push(pezzo);
      if (finale) risolvi();
    });
  });

  const lavora = async () => {
    for (let indice = prossima++; indice < voci.length; indice = prossima++) {
      if (segnale?.aborted) throw new DownloadAnnullato();
      try {
        const dati = await voci[indice].carica();
        if (segnale?.aborted) throw new DownloadAnnullato();
        const file = new ZipPassThrough(nomi[indice]);
        zip.add(file);
        file.push(dati, true);
        incluse += 1;
      } catch (errore) {
        if (errore instanceof DownloadAnnullato || segnale?.aborted) throw new DownloadAnnullato();
        fallite.push(nomi[indice]);
      }
      fatte += 1;
      onProgresso?.(fatte, voci.length);
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.max(1, Math.min(insieme, voci.length)) }, lavora));
  } catch (errore) {
    zip.terminate();
    throw errore;
  }
  if (incluse === 0) {
    zip.terminate();
    throw new Error("Non è stato possibile scaricare nessuna delle foto scelte.");
  }
  zip.end();
  await chiuso;
  return { blob: new Blob(parti as BlobPart[], { type: "application/zip" }), incluse, fallite };
}

const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms));

/** Scarica un indirizzo riprovando quando il server chiede di rallentare (429) o è momentaneamente giù. */
export async function scaricaConRiprova(
  indirizzo: string,
  opzioni: { segnale?: AbortSignal; tentativi?: number; attesaMs?: number; fetch?: typeof fetch } = {}
): Promise<Blob> {
  const { segnale, tentativi = 4, attesaMs = 1500 } = opzioni;
  const chiama = opzioni.fetch ?? fetch;
  let ultimo = "";
  for (let tentativo = 1; tentativo <= tentativi; tentativo += 1) {
    const risposta = await chiama(indirizzo, { signal: segnale, cache: "no-store" });
    if (risposta.ok) return risposta.blob();
    ultimo = `HTTP ${risposta.status}`;
    if (risposta.status !== 429 && risposta.status < 500) break;
    if (tentativo < tentativi) await pausa(attesaMs * tentativo);
  }
  throw new Error(`File non scaricato (${ultimo})`);
}

/** Converte una foto in JPEG nel browser: i file WebP non si aprono ovunque, il JPEG sì. */
export async function inJpeg(blob: Blob, qualita = 0.9): Promise<Blob> {
  if (blob.type === "image/jpeg") return blob;
  const immagine = await createImageBitmap(blob);
  try {
    const tela = document.createElement("canvas");
    tela.width = immagine.width;
    tela.height = immagine.height;
    const contesto = tela.getContext("2d");
    if (!contesto) throw new Error("Conversione della foto non riuscita");
    contesto.fillStyle = "#ffffff";
    contesto.fillRect(0, 0, tela.width, tela.height);
    contesto.drawImage(immagine, 0, 0);
    return await new Promise<Blob>((risolvi, rifiuta) => {
      tela.toBlob((jpeg) => (jpeg ? risolvi(jpeg) : rifiuta(new Error("Conversione della foto non riuscita"))), "image/jpeg", qualita);
    });
  } finally {
    immagine.close();
  }
}

/** Fa partire il salvataggio di un file già pronto nel browser. */
export function salvaFile(blob: Blob, nome: string): void {
  const indirizzo = URL.createObjectURL(blob);
  const collegamento = document.createElement("a");
  collegamento.href = indirizzo;
  collegamento.download = nome;
  collegamento.style.display = "none";
  document.body.appendChild(collegamento);
  collegamento.click();
  collegamento.remove();
  window.setTimeout(() => URL.revokeObjectURL(indirizzo), 60_000);
}

export const indirizzoOriginale = (idDrive: string) => `/apps/archivio-ai/originale?id=${encodeURIComponent(idDrive)}`;
