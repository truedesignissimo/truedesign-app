export type Vista = "visibili" | "da-rivedere" | "nascoste" | "tutte";

export interface Filtri {
  testo: string;
  collezione: string;
  tipologia: string;
  colore: string;
  contesto: string;
  shooting: string;
  vista: Vista;
}

export const VISTE: { id: Vista; etichetta: string }[] = [
  { id: "visibili", etichetta: "In archivio" },
  { id: "da-rivedere", etichetta: "Da rivedere" },
  { id: "nascoste", etichetta: "Nascoste" },
  { id: "tutte", etichetta: "Tutte" },
];

/** Le viste dell'area di revisione, riservata agli amministratori. */
export const VISTE_REVISIONE = VISTE.filter((vista) => vista.id !== "visibili");

export const FILTRI_VUOTI: Filtri = {
  testo: "",
  collezione: "",
  tipologia: "",
  colore: "",
  contesto: "",
  shooting: "",
  vista: "visibili",
};

const MAX_PAROLE = 6;
const MAX_TESTO = 120;

/**
 * Parole da cercare: minuscole, senza segni che romperebbero il filtro
 * (virgole, parentesi, asterischi…), al massimo sei.
 */
export function paroleDiRicerca(testo: string): string[] {
  const viste = new Set<string>();
  for (const grezza of testo.slice(0, MAX_TESTO).toLowerCase().split(/\s+/)) {
    const parola = grezza.replace(/[^\p{L}\p{N}-]/gu, "").replace(/^-+|-+$/g, "");
    if (parola.length >= 2) viste.add(parola);
    if (viste.size === MAX_PAROLE) break;
  }
  return [...viste];
}

/**
 * Radici da cercare: alle parole di almeno quattro lettere si toglie la vocale finale,
 * così "rossa" trova "rosso" e "poltrone" trova "poltrona".
 */
export function radiciDiRicerca(testo: string): string[] {
  const radici = paroleDiRicerca(testo).map((parola) =>
    parola.length >= 4 ? parola.replace(/[aeiouàèéìòù]$/u, "") : parola
  );
  return [...new Set(radici)];
}

/** Quanti filtri sono accesi, senza contare la vista. */
export function contaFiltriAttivi(filtri: Filtri): number {
  return [filtri.testo.trim(), filtri.collezione, filtri.tipologia, filtri.colore, filtri.contesto, filtri.shooting]
    .filter(Boolean).length;
}

const CHIAVI: Record<Exclude<keyof Filtri, "vista">, string> = {
  testo: "q",
  collezione: "collezione",
  tipologia: "tipologia",
  colore: "colore",
  contesto: "contesto",
  shooting: "shooting",
};

const isVista = (valore: string | null): valore is Vista => VISTE.some((vista) => vista.id === valore);

export function filtriDaQuery(query: string): Filtri {
  const parametri = new URLSearchParams(query);
  const filtri: Filtri = { ...FILTRI_VUOTI };
  for (const [campo, chiave] of Object.entries(CHIAVI) as [Exclude<keyof Filtri, "vista">, string][]) {
    filtri[campo] = (parametri.get(chiave) ?? "").slice(0, MAX_TESTO);
  }
  const vista = parametri.get("vista");
  if (isVista(vista)) filtri.vista = vista;
  return filtri;
}

export function filtriInQuery(filtri: Filtri): string {
  const parametri = new URLSearchParams();
  for (const [campo, chiave] of Object.entries(CHIAVI) as [Exclude<keyof Filtri, "vista">, string][]) {
    const valore = filtri[campo].trim();
    if (valore) parametri.set(chiave, valore);
  }
  if (filtri.vista !== FILTRI_VUOTI.vista) parametri.set("vista", filtri.vista);
  return parametri.toString();
}

interface StatoImmagine {
  stato: "auto" | "approvata" | "nascosta";
  sopraSoglia: boolean;
  visibile: boolean;
}

/** Dice se una foto compare nella vista scelta (stessa regola usata dalla ricerca). */
export function appartieneAllaVista(immagine: StatoImmagine, vista: Vista): boolean {
  if (vista === "visibili") return immagine.visibile;
  if (vista === "nascoste") return immagine.stato === "nascosta";
  if (vista === "da-rivedere") return immagine.stato === "auto" && !immagine.sopraSoglia;
  return true;
}

interface Conteggi {
  visibili: number;
  daRivedere: number;
  nascoste: number;
  tutte: number;
}

/** Aggiorna i numeri delle viste dopo una revisione, senza rileggere tutto l'archivio. */
export function aggiornaConteggi<T extends Conteggi>(conteggi: T, prima: StatoImmagine, dopo: StatoImmagine): T {
  const passo = (vista: Vista) => Number(appartieneAllaVista(dopo, vista)) - Number(appartieneAllaVista(prima, vista));
  return {
    ...conteggi,
    visibili: Math.max(0, conteggi.visibili + passo("visibili")),
    daRivedere: Math.max(0, conteggi.daRivedere + passo("da-rivedere")),
    nascoste: Math.max(0, conteggi.nascoste + passo("nascoste")),
  };
}
