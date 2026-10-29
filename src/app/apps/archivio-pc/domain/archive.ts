import type { PerformanceProfile } from "./performance";

export type PcRecord = {
  id: number;
  assegnatario: string;
  /** Assegnazione provvisoria, correggibile senza cambiare l'algoritmo. */
  profilo: PerformanceProfile;
  nome_dispositivo: string;
  tipologia: string;
  marca: string;
  modello: string;
  anno: string;
  numero_serie: string;
  processore: string;
  ram: string;
  gpu: string;
  schermo: string;
  archiviazione: string;
  sistema_operativo: string;
  versione_os: string;
  data_installazione_os: string;
  data_acquisto: string;
  aggiornata: string;
  note: string;
  area: string;
  foto: string;
};

export type PcSort = "assignee" | "area" | "model" | "updated";

export type PcFilters = {
  query: string;
  area: string;
  type: string;
  sort: PcSort;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it")
    .trim();

const searchableText = (pc: PcRecord) =>
  normalize(
    [
      pc.assegnatario,
      pc.nome_dispositivo,
      pc.tipologia,
      pc.marca,
      pc.modello,
      pc.numero_serie,
      pc.processore,
      pc.ram,
      pc.gpu,
      pc.archiviazione,
      pc.sistema_operativo,
      pc.versione_os,
      pc.note,
      pc.area,
    ].join(" "),
  );

const parseItalianDate = (value: string) => {
  const [day, month, year] = value.split("/").map(Number);
  return day && month && year ? Date.UTC(year, month - 1, day) : 0;
};

export function filterPcs(pcs: PcRecord[], filters: PcFilters) {
  const tokens = normalize(filters.query).split(/\s+/).filter(Boolean);
  const filtered = pcs.filter((pc) => {
    const haystack = searchableText(pc);
    return (
      (!filters.area || pc.area === filters.area) &&
      (!filters.type || pc.tipologia === filters.type) &&
      tokens.every((token) => haystack.includes(token))
    );
  });

  return filtered.toSorted((a, b) => {
    if (filters.sort === "updated") {
      return parseItalianDate(b.aggiornata) - parseItalianDate(a.aggiornata) || a.id - b.id;
    }

    const left =
      filters.sort === "area" ? `${a.area} ${a.assegnatario}` :
      filters.sort === "model" ? `${a.marca} ${a.modello}` :
      a.assegnatario;
    const right =
      filters.sort === "area" ? `${b.area} ${b.assegnatario}` :
      filters.sort === "model" ? `${b.marca} ${b.modello}` :
      b.assegnatario;
    return left.localeCompare(right, "it", { sensitivity: "base" });
  });
}

export function uniqueValues(pcs: PcRecord[], key: "area" | "tipologia") {
  return [...new Set(pcs.map((pc) => pc[key]).filter(Boolean))].toSorted((a, b) =>
    a.localeCompare(b, "it", { sensitivity: "base" }),
  );
}

export function summarizePcs(pcs: PcRecord[]) {
  return {
    total: pcs.length,
    notebooks: pcs.filter((pc) => pc.tipologia === "Notebook").length,
    areas: new Set(pcs.map((pc) => pc.area).filter(Boolean)).size,
    windows11: pcs.filter((pc) => pc.sistema_operativo.includes("Windows 11")).length,
  };
}
