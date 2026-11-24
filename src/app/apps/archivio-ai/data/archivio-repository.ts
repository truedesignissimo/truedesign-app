import type { SupabaseClient } from "@supabase/supabase-js";
import { radiciDiRicerca, type Filtri } from "../domain/filtri";
import type {
  ImmagineArchivio,
  OpzioniFiltri,
  ProdottoAddestrato,
  Riconoscimento,
  RisultatoRicerca,
  StatoRevisione,
} from "./tipi";

export const BUCKET = "archivio-immagini";
export const PER_PAGINA = 48;
const DURATA_LINK_SECONDI = 60 * 60;
const BLOCCO_OPZIONI = 1000;
const MAX_BLOCCHI_OPZIONI = 20;

const COLONNE = [
  "id", "id_drive", "nome_file", "nome_shooting", "tipologia_shooting", "pertinente",
  "tipologie", "colori", "contesto", "descrizione_breve",
  "prodotto_principale_ai", "collezione_principale_ai", "accuratezza_principale_ai",
  "prodotto_secondario_ai", "collezione_secondaria_ai", "accuratezza_secondaria_ai",
  "prodotto_principale", "collezione_principale", "accuratezza_principale",
  "prodotto_secondario", "collezione_secondaria", "accuratezza_secondaria",
  "stato_revisione", "revisionato_at", "in_addestramento",
  "anteprima_path", "miniatura_path", "larghezza", "altezza", "peso_originale_byte",
  "created_at", "sopra_soglia", "visibile", "collezione_top",
].join(",");

const COLONNE_OPZIONI = "collezione_top,nome_shooting,tipologie,colori,contesto,stato_revisione,sopra_soglia,visibile";

/**
 * "admin" vede tutto e può fare la revisione; "utente" vede solo le foto visibili.
 * A decidere chi è admin è il flag `profiles.is_admin`: il database applica la stessa regola.
 */
export type Ruolo = "admin" | "utente";
const COLONNE_RICERCA = ["search_index", "prodotto_principale", "nome_shooting", "nome_file"];

type Riga = Record<string, unknown>;

const testo = (valore: unknown): string | null => {
  if (typeof valore !== "string") return null;
  const pulito = valore.trim();
  return pulito || null;
};

const numero = (valore: unknown): number | null => {
  if (valore === null || valore === undefined || valore === "") return null;
  const n = Number(valore);
  return Number.isFinite(n) ? n : null;
};

const lista = (valore: unknown): string[] =>
  Array.isArray(valore) ? valore.filter((voce): voce is string => typeof voce === "string" && voce.trim() !== "") : [];

const riconoscimento = (riga: Riga, prodotto: string, collezione: string, accuratezza: string): Riconoscimento => ({
  prodotto: testo(riga[prodotto]),
  collezione: testo(riga[collezione]),
  accuratezza: numero(riga[accuratezza]),
});

export function immagineDaRiga(riga: Riga): ImmagineArchivio {
  const stato = riga.stato_revisione;
  return {
    id: Number(riga.id),
    idDrive: String(riga.id_drive ?? ""),
    nomeFile: String(riga.nome_file ?? ""),
    nomeShooting: String(riga.nome_shooting ?? ""),
    tipologiaShooting: String(riga.tipologia_shooting ?? ""),
    pertinente: riga.pertinente !== false,
    tipologie: lista(riga.tipologie),
    colori: lista(riga.colori),
    contesto: testo(riga.contesto),
    descrizione: testo(riga.descrizione_breve) ?? "",
    principale: riconoscimento(riga, "prodotto_principale", "collezione_principale", "accuratezza_principale"),
    secondario: riconoscimento(riga, "prodotto_secondario", "collezione_secondaria", "accuratezza_secondaria"),
    principaleAi: riconoscimento(riga, "prodotto_principale_ai", "collezione_principale_ai", "accuratezza_principale_ai"),
    secondarioAi: riconoscimento(riga, "prodotto_secondario_ai", "collezione_secondaria_ai", "accuratezza_secondaria_ai"),
    stato: stato === "approvata" || stato === "nascosta" ? stato : "auto",
    revisionataIl: testo(riga.revisionato_at),
    inAddestramento: riga.in_addestramento === true,
    anteprimaPath: testo(riga.anteprima_path),
    miniaturaPath: testo(riga.miniatura_path),
    larghezza: numero(riga.larghezza),
    altezza: numero(riga.altezza),
    pesoOriginaleByte: numero(riga.peso_originale_byte),
    creataIl: String(riga.created_at ?? ""),
    sopraSoglia: riga.sopra_soglia === true,
    visibile: riga.visibile === true,
    collezioneTop: testo(riga.collezione_top),
  };
}

const perFrequenza = (conteggi: Map<string, number>) =>
  [...conteggi.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it")).map(([voce]) => voce);

const alfabetico = (voci: Set<string>) => [...voci].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));

/** Valori disponibili nei filtri e numero di foto per vista, calcolati dalle righe dell'archivio. */
export function calcolaOpzioni(righe: Riga[]): OpzioniFiltri {
  const collezioni = new Set<string>();
  const shooting = new Set<string>();
  const contesti = new Set<string>();
  const tipologie = new Map<string, number>();
  const colori = new Map<string, number>();
  const conteggi = { visibili: 0, daRivedere: 0, nascoste: 0, tutte: righe.length };

  for (const riga of righe) {
    const collezione = testo(riga.collezione_top);
    if (collezione) collezioni.add(collezione);
    const nomeShooting = testo(riga.nome_shooting);
    if (nomeShooting) shooting.add(nomeShooting);
    const contesto = testo(riga.contesto);
    if (contesto) contesti.add(contesto);
    for (const voce of lista(riga.tipologie)) tipologie.set(voce, (tipologie.get(voce) ?? 0) + 1);
    for (const voce of lista(riga.colori)) colori.set(voce, (colori.get(voce) ?? 0) + 1);

    if (riga.visibile === true) conteggi.visibili += 1;
    if (riga.stato_revisione === "nascosta") conteggi.nascoste += 1;
    if (riga.stato_revisione === "auto" && riga.sopra_soglia !== true) conteggi.daRivedere += 1;
  }

  return {
    collezioni: alfabetico(collezioni),
    shooting: alfabetico(shooting),
    tipologie: perFrequenza(tipologie),
    colori: perFrequenza(colori),
    contesti: alfabetico(contesti),
    conteggi,
  };
}

const esito = <T>(risultato: { data: T; error: { message: string } | null }, operazione: string): T => {
  if (risultato.error) throw new Error(`${operazione}: ${risultato.error.message}`);
  return risultato.data;
};

export function creaArchivioRepository(supabase: SupabaseClient, ruolo: Ruolo = "admin") {
  const soloLettura = (operazione: string) =>
    Promise.reject(new Error(`${operazione}: riservato agli amministratori`));

  const aggiorna = async (id: number, valori: Record<string, unknown>, operazione: string) => {
    const risultato = await supabase
      .from("archivio_immagini")
      .update(valori)
      .eq("id", id)
      .select(COLONNE)
      .maybeSingle();
    const riga = esito(risultato, operazione) as Riga | null;
    if (!riga) throw new Error(`${operazione}: immagine non trovata o permesso mancante`);
    return immagineDaRiga(riga);
  };

  return {
    async cerca(filtri: Filtri, pagina: number): Promise<RisultatoRicerca> {
      let query = supabase.from("archivio_immagini_ricerca").select(COLONNE, { count: "exact" });

      for (const parola of radiciDiRicerca(filtri.testo)) {
        query = query.or(COLONNE_RICERCA.map((colonna) => `${colonna}.ilike.*${parola}*`).join(","));
      }
      if (filtri.collezione) query = query.eq("collezione_top", filtri.collezione);
      if (filtri.tipologia) query = query.contains("tipologie", [filtri.tipologia]);
      if (filtri.colore) query = query.contains("colori", [filtri.colore]);
      if (filtri.contesto) query = query.eq("contesto", filtri.contesto);
      if (filtri.shooting) query = query.eq("nome_shooting", filtri.shooting);

      // Le viste di revisione valgono solo per gli admin: tutti gli altri vedono sempre e solo le foto visibili.
      if (ruolo !== "admin" || filtri.vista === "visibili") query = query.eq("visibile", true);
      if (ruolo === "admin" && filtri.vista === "nascoste") query = query.eq("stato_revisione", "nascosta");
      if (ruolo === "admin" && filtri.vista === "da-rivedere") {
        // Le più vicine alla soglia per prime: sono le più veloci da decidere.
        query = query
          .eq("stato_revisione", "auto")
          .eq("sopra_soglia", false)
          .order("accuratezza_principale", { ascending: false, nullsFirst: false });
      }

      const inizio = Math.max(0, pagina) * PER_PAGINA;
      const risultato = await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(inizio, inizio + PER_PAGINA - 1);
      const righe = esito(risultato, "Ricerca in archivio") as unknown as Riga[] | null;
      return { immagini: (righe ?? []).map(immagineDaRiga), totale: risultato.count ?? 0 };
    },

    async opzioni(): Promise<OpzioniFiltri> {
      const righe: Riga[] = [];
      for (let blocco = 0; blocco < MAX_BLOCCHI_OPZIONI; blocco += 1) {
        const inizio = blocco * BLOCCO_OPZIONI;
        const risultato = await supabase
          .from("archivio_immagini")
          .select(COLONNE_OPZIONI)
          .order("id", { ascending: true })
          .range(inizio, inizio + BLOCCO_OPZIONI - 1);
        const parte = (esito(risultato, "Lettura dei filtri") as unknown as Riga[] | null) ?? [];
        righe.push(...parte);
        if (parte.length < BLOCCO_OPZIONI) break;
      }
      return calcolaOpzioni(righe);
    },

    async prodotti(): Promise<ProdottoAddestrato[]> {
      if (ruolo !== "admin") return [];
      const righe = (esito(await supabase.rpc("archivio_ai_prodotti"), "Lettura dei prodotti") as Riga[] | null) ?? [];
      return righe
        .map((riga) => ({ prodotto: testo(riga.concept) ?? "", collezione: testo(riga.collection) ?? "" }))
        .filter((voce) => voce.prodotto && voce.collezione)
        .sort((a, b) => a.prodotto.localeCompare(b.prodotto, "it", { sensitivity: "base" }));
    },

    /** Link temporanei per i file del bucket privato: percorso → indirizzo. */
    async linkFirmati(percorsi: string[]): Promise<Record<string, string>> {
      const unici = [...new Set(percorsi.filter(Boolean))];
      if (!unici.length) return {};
      const risultato = await supabase.storage.from(BUCKET).createSignedUrls(unici, DURATA_LINK_SECONDI);
      const voci = esito(risultato, "Lettura delle immagini") ?? [];
      const link: Record<string, string> = {};
      for (const voce of voci) {
        if (voce.path && voce.signedUrl && !voce.error) link[voce.path] = voce.signedUrl;
      }
      return link;
    },

    cambiaStato(id: number, stato: StatoRevisione): Promise<ImmagineArchivio> {
      if (ruolo !== "admin") return soloLettura("Aggiornamento dello stato");
      return aggiorna(id, { stato_revisione: stato }, "Aggiornamento dello stato");
    },

    /** Correzione a mano: il prodotto scelto diventa il principale, confermato al 100%, e la foto è approvata. */
    correggiProdotto(id: number, prodotto: ProdottoAddestrato): Promise<ImmagineArchivio> {
      if (ruolo !== "admin") return soloLettura("Correzione del prodotto");
      return aggiorna(
        id,
        {
          prodotto_principale: prodotto.prodotto,
          collezione_principale: prodotto.collezione,
          accuratezza_principale: 1,
          stato_revisione: "approvata",
        },
        "Correzione del prodotto"
      );
    },

    /** Rimette i valori scritti dall'AI e toglie la revisione. */
    ripristinaAi(immagine: ImmagineArchivio): Promise<ImmagineArchivio> {
      if (ruolo !== "admin") return soloLettura("Ripristino dei valori AI");
      return aggiorna(
        immagine.id,
        {
          prodotto_principale: immagine.principaleAi.prodotto,
          collezione_principale: immagine.principaleAi.collezione,
          accuratezza_principale: immagine.principaleAi.accuratezza,
          prodotto_secondario: immagine.secondarioAi.prodotto,
          collezione_secondaria: immagine.secondarioAi.collezione,
          accuratezza_secondaria: immagine.secondarioAi.accuratezza,
          stato_revisione: "auto",
        },
        "Ripristino dei valori AI"
      );
    },
  };
}

export type ArchivioRepository = ReturnType<typeof creaArchivioRepository>;
