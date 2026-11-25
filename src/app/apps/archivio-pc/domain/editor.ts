import type { PcRecord } from "./archive";

export const PROFILES = ["Ufficio", "Tecnico", "Grafica", "3D avanzato"] as const;
export const FIELD_GROUPS = [
  ["Assegnazione", [["assegnatario","Assegnatario"], ["nome_dispositivo","Nome dispositivo"], ["area","Reparto"], ["profilo","Profilo"], ["tipologia","Tipologia"]]],
  ["Hardware", [["marca","Marca"], ["modello","Modello"], ["anno","Anno"], ["numero_serie","Numero di serie"], ["processore","Processore"], ["core_processore","Core CPU"], ["processori_logici","Processori logici"], ["ram","RAM"], ["gpu","Scheda video"], ["schermo","Schermo"], ["archiviazione","Archiviazione"]]],
  ["Sistema", [["sistema_operativo","Sistema operativo"], ["versione_os","Versione"], ["data_installazione_os","Data installazione"]]],
  ["Acquisto", [["data_acquisto","Data di acquisto"], ["prezzo_acquisto","Prezzo"], ["venditore","Venditore"], ["articolo_acquisto","Articolo"]]],
  ["Note e immagine", [["note","Note"], ["foto","Immagine"]]],
] as const;
export const EDIT_FIELDS = FIELD_GROUPS.flatMap(([, fields]) => [...fields] as Array<readonly [EditKey, string]>);
export type EditKey = (typeof FIELD_GROUPS)[number][1][number][0];
export type PcFields = Required<Pick<PcRecord, EditKey>>;
export type PcRow = PcFields & { id: number; updated_on: string; updated_at: string };
export type EditorResult = { ok: true } | { ok: false; error: string; field?: EditKey };

export function normalizePcInput(input: unknown): { ok: true; fields: PcFields } | Extract<EditorResult, { ok: false }> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Dati non validi." };
  const values = input as Record<string, unknown>;
  const fields = {} as PcFields;
  for (const [key, label] of EDIT_FIELDS) {
    const raw = Object.hasOwn(values, key) ? values[key] : "";
    const max = key === "note" ? 2000 : 200;
    if (typeof raw !== "string" || raw.trim().length > max || raw.includes("\0")) {
      return { ok: false, field: key, error: `${label}: inserisci un testo di massimo ${max} caratteri.` };
    }
    const value = raw.trim();
    if (key === "profilo") {
      const profile = PROFILES.find((item) => item === value);
      if (!profile) return { ok: false, field: key, error: "Seleziona un profilo valido." };
      fields.profilo = profile;
    } else {
      fields[key] = value;
    }
  }
  for (const [field, label] of [["assegnatario", "Assegnatario"], ["tipologia", "Tipologia"]] as const) {
    if (!fields[field]) return { ok: false, field, error: `${label}: campo obbligatorio.` };
  }
  if (/\b(?:server|vm|virtual machine|macchin[ae] virtual[ie])\b/i.test(fields.tipologia)) {
    return { ok: false, field: "tipologia", error: "L’archivio accetta solo PC fisici." };
  }
  if (fields.area.toLowerCase() === "da assegnare") fields.area = "";
  return { ok: true, fields };
}

export function toPcRecord(row: PcRow): PcRecord {
  const fields = Object.fromEntries(EDIT_FIELDS.map(([key]) => [key, row[key]])) as PcFields;
  return { ...fields, id: row.id, aggiornata: row.updated_on.split("-").reverse().join("/") };
}
