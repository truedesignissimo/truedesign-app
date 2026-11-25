export type StatoRevisione = "auto" | "approvata" | "nascosta";

export interface Riconoscimento {
  prodotto: string | null;
  collezione: string | null;
  /** Frazione da 0 a 1. */
  accuratezza: number | null;
}

export interface ImmagineArchivio {
  id: number;
  idDrive: string;
  nomeFile: string;
  nomeShooting: string;
  tipologiaShooting: string;
  pertinente: boolean;
  tipologie: string[];
  colori: string[];
  contesto: string | null;
  descrizione: string;
  /** Valore usato dall'archivio (può essere corretto a mano). */
  principale: Riconoscimento;
  secondario: Riconoscimento;
  /** Valore scritto dall'AI: non cambia mai. */
  principaleAi: Riconoscimento;
  secondarioAi: Riconoscimento;
  stato: StatoRevisione;
  revisionataIl: string | null;
  inAddestramento: boolean;
  anteprimaPath: string | null;
  miniaturaPath: string | null;
  larghezza: number | null;
  altezza: number | null;
  pesoOriginaleByte: number | null;
  creataIl: string;
  sopraSoglia: boolean;
  visibile: boolean;
  collezioneTop: string | null;
}

export interface ProdottoAddestrato {
  prodotto: string;
  collezione: string;
}

export interface ConteggiViste {
  visibili: number;
  daRivedere: number;
  nascoste: number;
  tutte: number;
}

export interface OpzioniFiltri {
  collezioni: string[];
  shooting: string[];
  tipologie: string[];
  colori: string[];
  contesti: string[];
  conteggi: ConteggiViste;
}

export interface RisultatoRicerca {
  immagini: ImmagineArchivio[];
  totale: number;
}
