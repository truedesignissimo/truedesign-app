import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { FILTRI_VUOTI } from "../domain/filtri";
import { PER_PAGINA, calcolaOpzioni, creaArchivioRepository, immagineDaRiga } from "./archivio-repository";

const riga = {
  id: "12",
  id_drive: "19e_v_JXnxATgg27ilXSsiiEU_iSkDmSA",
  nome_file: "TRUE_Linate_020.jpg",
  nome_shooting: "Linate",
  tipologia_shooting: "Shooting",
  pertinente: true,
  tipologie: ["tavolo", "sgabello"],
  colori: ["beige"],
  contesto: "Indoor",
  descrizione_breve: " Sala d'attesa con tavoli alti. ",
  prodotto_principale_ai: "Tod-Sgabello",
  collezione_principale_ai: "Tod",
  accuratezza_principale_ai: "0.6400",
  prodotto_secondario_ai: null,
  collezione_secondaria_ai: null,
  accuratezza_secondaria_ai: null,
  prodotto_principale: "Wing",
  collezione_principale: "Wing",
  accuratezza_principale: 1,
  prodotto_secondario: "",
  collezione_secondaria: null,
  accuratezza_secondaria: null,
  stato_revisione: "approvata",
  revisionato_at: "2026-11-24T10:00:00+00:00",
  in_addestramento: false,
  anteprima_path: "anteprime/19e.webp",
  miniatura_path: "miniature/19e.webp",
  larghezza: 6000,
  altezza: 4000,
  peso_originale_byte: "8600000",
  created_at: "2026-11-24T09:00:00+00:00",
  sopra_soglia: true,
  visibile: true,
  collezione_top: "Wing",
};

/** Finto client Supabase: registra i filtri chiesti e risponde con il risultato dato. */
function clientFinto(risultato: Record<string, unknown>) {
  const chiamate: [string, ...unknown[]][] = [];
  const query: Record<string, unknown> = {
    then: (risolvi: (valore: unknown) => unknown) => Promise.resolve(risultato).then(risolvi),
  };
  for (const metodo of ["select", "or", "eq", "contains", "order", "range", "update", "maybeSingle"]) {
    query[metodo] = vi.fn((...argomenti: unknown[]) => {
      chiamate.push([metodo, ...argomenti]);
      return query;
    });
  }
  const from = vi.fn((tabella: string) => {
    chiamate.push(["from", tabella]);
    return query;
  });
  const rpc = vi.fn((funzione: string, argomenti?: unknown, opzioni?: unknown) => {
    chiamate.push(["rpc", funzione, argomenti, opzioni]);
    return query;
  });
  return { supabase: { from, rpc } as never, chiamate };
}

describe("schema dell'archivio", () => {
  const sql = readFileSync(
    new URL("../../../../../supabase/migrations/20261124_archivio_ai_schema.sql", import.meta.url),
    "utf8"
  );

  it("lascia leggere e rivedere l'archivio solo agli amministratori", () => {
    expect(sql).toContain("create table if not exists public.archivio_immagini");
    expect(sql).toContain("alter table public.archivio_immagini enable row level security");
    expect(sql).toContain('create policy "archivio immagini: admin read"');
    expect(sql).toContain('create policy "archivio immagini: admin review"');
    expect(sql).toContain("create or replace view public.archivio_immagini_ricerca");
    expect(sql).toContain("security_invoker = true");
  });

  it("permette di modificare solo le colonne usate dalla revisione", () => {
    const concessione = sql.slice(sql.indexOf("grant update ("), sql.indexOf(") on public.archivio_immagini to authenticated"));
    const colonne = concessione.replace("grant update (", "").split(",").map((colonna) => colonna.trim()).sort();
    expect(colonne).toEqual([
      "accuratezza_principale", "accuratezza_secondaria", "collezione_principale", "collezione_secondaria",
      "prodotto_principale", "prodotto_secondario", "stato_revisione",
    ]);
  });
});

describe("immagineDaRiga", () => {
  it("traduce la riga del database, numeri e testi compresi", () => {
    const immagine = immagineDaRiga(riga);
    expect(immagine).toMatchObject({
      id: 12,
      idDrive: "19e_v_JXnxATgg27ilXSsiiEU_iSkDmSA",
      descrizione: "Sala d'attesa con tavoli alti.",
      principale: { prodotto: "Wing", collezione: "Wing", accuratezza: 1 },
      principaleAi: { prodotto: "Tod-Sgabello", collezione: "Tod", accuratezza: 0.64 },
      secondario: { prodotto: null, collezione: null, accuratezza: null },
      stato: "approvata",
      pesoOriginaleByte: 8_600_000,
      visibile: true,
      collezioneTop: "Wing",
    });
  });

  it("regge righe incomplete", () => {
    const immagine = immagineDaRiga({ id: 1, id_drive: "abc", stato_revisione: "strano", tipologie: null, colori: [1, "blu", ""] });
    expect(immagine.stato).toBe("auto");
    expect(immagine.tipologie).toEqual([]);
    expect(immagine.colori).toEqual(["blu"]);
    expect(immagine.pertinente).toBe(true);
    expect(immagine.visibile).toBe(false);
  });
});

describe("calcolaOpzioni", () => {
  it("elenca i valori dei filtri e conta le foto per vista", () => {
    const opzioni = calcolaOpzioni([
      { collezione_top: "Wing", nome_shooting: "Linate", tipologie: ["tavolo"], colori: ["beige", "nero"], contesto: "Indoor", stato_revisione: "approvata", sopra_soglia: true, visibile: true },
      { collezione_top: "abisko", nome_shooting: "Linate", tipologie: ["tavolo", "sedia"], colori: ["nero"], contesto: "Outdoor", stato_revisione: "auto", sopra_soglia: false, visibile: false },
      { collezione_top: null, nome_shooting: "Milano 26", tipologie: [], colori: [], contesto: null, stato_revisione: "nascosta", sopra_soglia: true, visibile: false },
      { collezione_top: "Tod", nome_shooting: "Milano 26", tipologie: ["sedia"], colori: ["nero"], contesto: "Indoor", stato_revisione: "auto", sopra_soglia: true, visibile: true },
    ]);

    expect(opzioni.collezioni).toEqual(["abisko", "Tod", "Wing"]);
    expect(opzioni.shooting).toEqual(["Linate", "Milano 26"]);
    expect(opzioni.contesti).toEqual(["Indoor", "Outdoor"]);
    expect(opzioni.tipologie).toEqual(["sedia", "tavolo"]);
    expect(opzioni.colori).toEqual(["nero", "beige"]);
    expect(opzioni.conteggi).toEqual({ visibili: 2, daRivedere: 1, nascoste: 1, tutte: 4 });
  });
});

describe("repository dell'archivio", () => {
  it("cerca nella vista con tutti i filtri e la pagina richiesta", async () => {
    const { supabase, chiamate } = clientFinto({ data: [riga], error: null, count: 137 });
    const repository = creaArchivioRepository(supabase);

    const risultato = await repository.cerca(
      { testo: "Tavolo, rovere*", collezione: "Wing", tipologia: "tavolo", colore: "beige", contesto: "Indoor", shooting: "Linate", vista: "visibili" },
      2
    );

    expect(risultato.totale).toBe(137);
    expect(risultato.immagini).toHaveLength(1);
    expect(chiamate[0]).toEqual(["from", "archivio_immagini_ricerca"]);
    expect(chiamate).toContainEqual([
      "or",
      "search_index.ilike.*tavol*,prodotto_principale.ilike.*tavol*,nome_shooting.ilike.*tavol*,nome_file.ilike.*tavol*",
    ]);
    expect(chiamate.filter(([metodo]) => metodo === "or")).toHaveLength(2);
    expect(chiamate).toContainEqual(["eq", "collezione_top", "Wing"]);
    expect(chiamate).toContainEqual(["contains", "tipologie", ["tavolo"]]);
    expect(chiamate).toContainEqual(["contains", "colori", ["beige"]]);
    expect(chiamate).toContainEqual(["eq", "contesto", "Indoor"]);
    expect(chiamate).toContainEqual(["eq", "nome_shooting", "Linate"]);
    expect(chiamate).toContainEqual(["eq", "visibile", true]);
    expect(chiamate).toContainEqual(["range", PER_PAGINA * 2, PER_PAGINA * 3 - 1]);
  });

  it("nella vista da rivedere mostra prima le foto più vicine alla soglia", async () => {
    const { supabase, chiamate } = clientFinto({ data: [], error: null, count: 0 });
    await creaArchivioRepository(supabase).cerca({ ...FILTRI_VUOTI, vista: "da-rivedere" }, 0);

    expect(chiamate).toContainEqual(["eq", "stato_revisione", "auto"]);
    expect(chiamate).toContainEqual(["eq", "sopra_soglia", false]);
    const ordini = chiamate.filter(([metodo]) => metodo === "order").map(([, colonna]) => colonna);
    expect(ordini).toEqual(["accuratezza_principale", "created_at", "id"]);
  });

  it("la vista tutte non aggiunge filtri di stato", async () => {
    const { supabase, chiamate } = clientFinto({ data: [], error: null, count: 0 });
    await creaArchivioRepository(supabase).cerca({ ...FILTRI_VUOTI, vista: "tutte" }, 0);
    expect(chiamate.filter(([metodo]) => metodo === "eq")).toEqual([]);
  });

  it("segnala gli errori del database con l'operazione", async () => {
    const { supabase } = clientFinto({ data: null, error: { message: "permission denied" }, count: null });
    await expect(creaArchivioRepository(supabase).cerca(FILTRI_VUOTI, 0)).rejects.toThrow("Ricerca in archivio: permission denied");
  });

  it("la correzione scrive solo le colonne permesse e approva la foto", async () => {
    const { supabase, chiamate } = clientFinto({ data: riga, error: null });
    const immagine = await creaArchivioRepository(supabase).correggiProdotto(12, { prodotto: "Wing", collezione: "Wing" });

    expect(immagine.id).toBe(12);
    expect(chiamate).toContainEqual(["from", "archivio_immagini"]);
    expect(chiamate).toContainEqual([
      "update",
      { prodotto_principale: "Wing", collezione_principale: "Wing", accuratezza_principale: 1, stato_revisione: "approvata" },
    ]);
    expect(chiamate).toContainEqual(["eq", "id", 12]);
  });

  it("il ripristino rimette i valori dell'AI e toglie la revisione", async () => {
    const { supabase, chiamate } = clientFinto({ data: riga, error: null });
    await creaArchivioRepository(supabase).ripristinaAi(immagineDaRiga(riga));

    expect(chiamate).toContainEqual([
      "update",
      {
        prodotto_principale: "Tod-Sgabello",
        collezione_principale: "Tod",
        accuratezza_principale: 0.64,
        prodotto_secondario: null,
        collezione_secondaria: null,
        accuratezza_secondaria: null,
        stato_revisione: "auto",
      },
    ]);
  });

  it("avvisa se la modifica non trova la foto o non è permessa", async () => {
    const { supabase } = clientFinto({ data: null, error: null });
    await expect(creaArchivioRepository(supabase).cambiaStato(99, "nascosta")).rejects.toThrow("immagine non trovata");
  });
});

describe("permessi per gli utenti normali", () => {
  const sql = readFileSync(
    new URL("../../../../../supabase/migrations/20261125_archivio_ai_utenti.sql", import.meta.url),
    "utf8"
  );

  it("non aggiunge funzioni: chi è admin lo dice solo il flag esistente", () => {
    expect(sql).not.toMatch(/create\s+(or\s+replace\s+)?function/i);
  });

  it("fa leggere agli utenti approvati solo le foto visibili, e non fa scrivere nessuno in più", () => {
    const regola = sql.slice(sql.indexOf('create policy "archivio immagini: utenti read"'), sql.indexOf('drop policy if exists "archivio immagini: utenti read files"'));
    expect(regola).toContain("for select");
    expect(regola).toContain("visibile");
    expect(regola).toContain("approval_status = 'approved'");
    expect(sql).toContain('create policy "archivio immagini: utenti read files"');
    expect(sql).not.toMatch(/for\s+(update|insert|delete|all)/i);
    expect(sql).not.toMatch(/grant\s/i);
  });
});

describe("repository per un utente normale", () => {
  it("cerca nella stessa vista, sempre e solo tra le foto visibili", async () => {
    const { supabase, chiamate } = clientFinto({ data: [riga], error: null, count: 1 });
    const repository = creaArchivioRepository(supabase, "utente");

    const risultato = await repository.cerca({ ...FILTRI_VUOTI, collezione: "Wing", colore: "beige", vista: "da-rivedere" }, 0);

    expect(risultato.totale).toBe(1);
    expect(chiamate[0]).toEqual(["from", "archivio_immagini_ricerca"]);
    expect(chiamate).toContainEqual(["eq", "visibile", true]);
    expect(chiamate).toContainEqual(["eq", "collezione_top", "Wing"]);
    expect(chiamate).toContainEqual(["contains", "colori", ["beige"]]);
    expect(chiamate.filter(([metodo, colonna]) => metodo === "eq" && ["stato_revisione", "sopra_soglia"].includes(String(colonna)))).toEqual([]);
    expect(chiamate.filter(([metodo]) => metodo === "order").map(([, colonna]) => colonna)).toEqual(["created_at", "id"]);
  });

  it("non può fare la revisione e non chiede l'elenco dei prodotti", async () => {
    const { supabase, chiamate } = clientFinto({ data: riga, error: null });
    const repository = creaArchivioRepository(supabase, "utente");

    await expect(repository.cambiaStato(12, "approvata")).rejects.toThrow("riservato agli amministratori");
    await expect(repository.correggiProdotto(12, { prodotto: "Wing", collezione: "Wing" })).rejects.toThrow("riservato agli amministratori");
    await expect(repository.ripristinaAi(immagineDaRiga(riga))).rejects.toThrow("riservato agli amministratori");
    await expect(repository.prodotti()).resolves.toEqual([]);
    expect(chiamate).toEqual([]);
  });
});
