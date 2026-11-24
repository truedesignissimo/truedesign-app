"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Brand from "../../_components/brand";
import { creaArchivioRepository, PER_PAGINA, type ArchivioRepository, type Ruolo } from "./data/archivio-repository";
import type { ImmagineArchivio, OpzioniFiltri, ProdottoAddestrato } from "./data/tipi";
import {
  FILTRI_VUOTI,
  VISTE_REVISIONE,
  aggiornaConteggi,
  appartieneAllaVista,
  contaFiltriAttivi,
  filtriDaQuery,
  filtriInQuery,
  type Filtri,
  type Vista,
} from "./domain/filtri";
import { dettaglioCarta, etichettaStato, percentuale, riconoscimentoTop } from "./domain/formato";
import {
  DownloadAnnullato,
  MAX_LEGGERE,
  MAX_ORIGINALI,
  creaZip,
  inJpeg,
  indirizzoOriginale,
  nomeVersioneLeggera,
  nomeZip,
  salvaFile,
  scaricaConRiprova,
  type VoceZip,
} from "./domain/scarica";
import { IconaCerca, IconaChiudi, IconaScarica, IconaSpunta } from "./icone";
import { SchedaImmagine } from "./scheda-immagine";
import styles from "./archivio-ai.module.css";

type Caricamento = "carica" | "pronto" | "errore";
type TipoZip = "leggere" | "originali";

interface Props {
  ruolo: Ruolo;
  /** Vero quando l'originale passa dall'app: senza, si apre il file su Drive e lo ZIP degli originali non c'è. */
  originaliDallApp: boolean;
  repository?: ArchivioRepository;
}

const messaggioErrore = (errore: unknown) =>
  errore instanceof Error && errore.message ? errore.message : "Si è verificato un errore.";

const numero = (valore: number) => valore.toLocaleString("it-IT");
const foto = (quante: number) => `${numero(quante)} foto`;

const conteggioVista = (opzioni: OpzioniFiltri | null, vista: Vista): number | null => {
  if (!opzioni) return null;
  if (vista === "visibili") return opzioni.conteggi.visibili;
  if (vista === "da-rivedere") return opzioni.conteggi.daRivedere;
  if (vista === "nascoste") return opzioni.conteggi.nascoste;
  return opzioni.conteggi.tutte;
};

const bytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

export function ArchivioAi({ ruolo, originaliDallApp, repository: fornito }: Props) {
  const repository = useMemo(() => fornito ?? creaArchivioRepository(createClient(), ruolo), [fornito, ruolo]);
  const admin = ruolo === "admin";

  const [avviato, setAvviato] = useState(false);
  const [filtri, setFiltri] = useState<Filtri>(FILTRI_VUOTI);
  const [testo, setTesto] = useState("");
  const [immagini, setImmagini] = useState<ImmagineArchivio[]>([]);
  const [totale, setTotale] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [stato, setStato] = useState<Caricamento>("carica");
  const [errore, setErrore] = useState("");
  const [caricaAltre, setCaricaAltre] = useState(false);
  const [link, setLink] = useState<Record<string, string>>({});
  const [caricate, setCaricate] = useState<Record<number, true>>({});
  const [opzioni, setOpzioni] = useState<OpzioniFiltri | null>(null);
  const [prodotti, setProdotti] = useState<ProdottoAddestrato[]>([]);
  const [apertaId, setApertaId] = useState<number | null>(null);
  const [avviso, setAvviso] = useState("");
  const [tentativo, setTentativo] = useState(0);
  const [scelte, setScelte] = useState<Map<number, ImmagineArchivio>>(new Map());
  const [scarico, setScarico] = useState<{ tipo: TipoZip; fatte: number; totale: number } | null>(null);

  const richiesta = useRef(0);
  const linkRinnovati = useRef(new Set<string>());
  const ultimaAperta = useRef<number | null>(null);
  const annullaScarico = useRef<AbortController | null>(null);

  const inRevisione = admin && filtri.vista !== "visibili";

  // I filtri iniziali arrivano dall'indirizzo, così una ricerca si può salvare o condividere.
  useEffect(() => {
    const iniziali = filtriDaQuery(window.location.search);
    if (!admin) iniziali.vista = "visibili";
    setFiltri(iniziali);
    setTesto(iniziali.testo);
    setAvviato(true);
  }, [admin]);

  useEffect(() => {
    if (!avviato) return;
    let attivo = true;
    repository.opzioni().then((valori) => { if (attivo) setOpzioni(valori); }).catch(() => undefined);
    repository.prodotti().then((valori) => { if (attivo) setProdotti(valori); }).catch(() => undefined);
    return () => { attivo = false; };
  }, [avviato, repository]);

  // La ricerca parte poco dopo l'ultima lettera, non a ogni tasto.
  useEffect(() => {
    if (!avviato) return;
    const attesa = window.setTimeout(() => {
      setFiltri((attuali) => (attuali.testo === testo ? attuali : { ...attuali, testo }));
    }, 300);
    return () => window.clearTimeout(attesa);
  }, [avviato, testo]);

  const aggiungiLink = useCallback(async (percorsi: (string | null)[], numeroRichiesta?: number) => {
    const daChiedere = percorsi.filter((percorso): percorso is string => Boolean(percorso));
    if (!daChiedere.length) return;
    try {
      const nuovi = await repository.linkFirmati(daChiedere);
      if (numeroRichiesta !== undefined && numeroRichiesta !== richiesta.current) return;
      setLink((attuali) => ({ ...attuali, ...nuovi }));
    } catch {
      // Le foto restano con il segnaposto: l'elenco è comunque utilizzabile.
    }
  }, [repository]);

  useEffect(() => {
    if (!avviato) return;
    const numeroRichiesta = ++richiesta.current;
    setStato("carica");
    setErrore("");

    repository.cerca(filtri, 0)
      .then((risultato) => {
        if (numeroRichiesta !== richiesta.current) return;
        setImmagini(risultato.immagini);
        setTotale(risultato.totale);
        setPagina(0);
        setStato("pronto");
        void aggiungiLink(risultato.immagini.map((immagine) => immagine.miniaturaPath), numeroRichiesta);
      })
      .catch((problema) => {
        if (numeroRichiesta !== richiesta.current) return;
        setImmagini([]);
        setTotale(0);
        setErrore(messaggioErrore(problema));
        setStato("errore");
      });

    const query = filtriInQuery(filtri);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [avviato, filtri, repository, aggiungiLink, tentativo]);

  const caricaPaginaSuccessiva = async () => {
    const numeroRichiesta = richiesta.current;
    setCaricaAltre(true);
    setAvviso("");
    try {
      const risultato = await repository.cerca(filtri, pagina + 1);
      if (numeroRichiesta !== richiesta.current) return;
      setImmagini((attuali) => {
        const presenti = new Set(attuali.map((immagine) => immagine.id));
        return [...attuali, ...risultato.immagini.filter((immagine) => !presenti.has(immagine.id))];
      });
      setTotale(risultato.totale);
      setPagina((attuale) => attuale + 1);
      void aggiungiLink(risultato.immagini.map((immagine) => immagine.miniaturaPath), numeroRichiesta);
    } catch (problema) {
      setAvviso(messaggioErrore(problema));
    } finally {
      setCaricaAltre(false);
    }
  };

  const cambia = (modifica: Partial<Filtri>) => setFiltri((attuali) => ({ ...attuali, ...modifica }));

  const azzera = () => {
    setTesto("");
    setFiltri((attuali) => ({ ...FILTRI_VUOTI, vista: attuali.vista }));
  };

  const rinnovaLink = (percorso: string | null) => {
    if (!percorso || linkRinnovati.current.has(percorso)) return;
    linkRinnovati.current.add(percorso);
    void aggiungiLink([percorso]);
  };

  const indiceAperta = apertaId === null ? -1 : immagini.findIndex((immagine) => immagine.id === apertaId);
  const aperta = indiceAperta >= 0 ? immagini[indiceAperta] : null;

  // Chiede l'anteprima grande della foto aperta e prepara quelle vicine, così sfogliare è immediato.
  useEffect(() => {
    if (indiceAperta < 0) return;
    const vicine = [immagini[indiceAperta], immagini[indiceAperta + 1], immagini[indiceAperta - 1]]
      .map((immagine) => immagine?.anteprimaPath ?? null)
      .filter((percorso): percorso is string => Boolean(percorso) && !link[percorso as string]);
    if (vicine.length) void aggiungiLink(vicine);
  }, [indiceAperta, immagini, link, aggiungiLink]);

  const apri = (id: number) => {
    ultimaAperta.current = id;
    setApertaId(id);
  };

  const chiudi = () => {
    const id = ultimaAperta.current;
    setApertaId(null);
    if (id !== null) {
      window.requestAnimationFrame(() => document.getElementById(`archivio-ai-foto-${id}`)?.focus());
    }
  };

  const vaiA = (passo: number) => {
    const prossima = immagini[indiceAperta + passo];
    if (prossima) apri(prossima.id);
  };

  /** Applica una revisione e tiene allineati elenco, numeri delle viste e scheda aperta. */
  const revisiona = async (prima: ImmagineArchivio, azione: () => Promise<ImmagineArchivio>, fatto: string) => {
    const dopo = await azione();
    setOpzioni((attuali) => (attuali ? { ...attuali, conteggi: aggiornaConteggi(attuali.conteggi, prima, dopo) } : attuali));

    if (appartieneAllaVista(dopo, filtri.vista)) {
      setImmagini((attuali) => attuali.map((immagine) => (immagine.id === dopo.id ? dopo : immagine)));
    } else {
      // La foto esce dalla vista: si passa alla successiva, così la revisione scorre.
      const indice = immagini.findIndex((immagine) => immagine.id === dopo.id);
      const restanti = immagini.filter((immagine) => immagine.id !== dopo.id);
      const prossima = restanti[Math.min(indice, restanti.length - 1)] ?? null;
      setImmagini(restanti);
      setTotale((attuale) => Math.max(0, attuale - 1));
      if (apertaId === dopo.id) {
        ultimaAperta.current = prossima?.id ?? null;
        setApertaId(prossima?.id ?? null);
      }
    }
    setAvviso(fatto);
  };

  useEffect(() => {
    if (!avviso) return;
    const attesa = window.setTimeout(() => setAvviso(""), 5000);
    return () => window.clearTimeout(attesa);
  }, [avviso]);

  // Selezione e download

  const scegli = (immagine: ImmagineArchivio, accesa: boolean) => {
    setScelte((attuali) => {
      const nuove = new Map(attuali);
      if (accesa) nuove.set(immagine.id, immagine);
      else nuove.delete(immagine.id);
      return nuove;
    });
  };

  const scegliMostrate = () => {
    setScelte((attuali) => {
      const nuove = new Map(attuali);
      for (const immagine of immagini) nuove.set(immagine.id, immagine);
      return nuove;
    });
  };

  const scaricaLeggera = async (immagine: ImmagineArchivio, segnale?: AbortSignal, indirizzo?: string) => {
    const percorso = immagine.anteprimaPath;
    if (!percorso) throw new Error("Versione leggera non disponibile");
    const sorgente = indirizzo ?? (await repository.linkFirmati([percorso]))[percorso];
    if (!sorgente) throw new Error("Versione leggera non disponibile");
    return inJpeg(await scaricaConRiprova(sorgente, { segnale }));
  };

  const scaricaUnaLeggera = async (immagine: ImmagineArchivio) => {
    salvaFile(await scaricaLeggera(immagine), nomeVersioneLeggera(immagine.nomeFile));
  };

  const scaricaScelte = async (tipo: TipoZip) => {
    const elenco = [...scelte.values()];
    if (!elenco.length || scarico) return;

    if (elenco.length === 1 && tipo === "originali") {
      window.open(indirizzoOriginale(elenco[0].idDrive), "_blank", "noopener");
      return;
    }

    const controllo = new AbortController();
    annullaScarico.current = controllo;
    setScarico({ tipo, fatte: 0, totale: elenco.length });
    setAvviso("");
    try {
      if (elenco.length === 1) {
        await scaricaUnaLeggera(elenco[0]);
        setAvviso("Foto scaricata");
        return;
      }

      const firmati = tipo === "leggere"
        ? await repository.linkFirmati(elenco.map((immagine) => immagine.anteprimaPath ?? ""))
        : {};
      const voci: VoceZip[] = elenco.map((immagine) =>
        tipo === "leggere"
          ? {
              nome: nomeVersioneLeggera(immagine.nomeFile),
              carica: async () => bytes(await scaricaLeggera(immagine, controllo.signal, firmati[immagine.anteprimaPath ?? ""])),
            }
          : {
              nome: immagine.nomeFile,
              carica: async () => bytes(await scaricaConRiprova(indirizzoOriginale(immagine.idDrive), { segnale: controllo.signal, tentativi: 2 })),
            }
      );
      const esito = await creaZip(voci, {
        segnale: controllo.signal,
        insieme: tipo === "leggere" ? 3 : 2,
        onProgresso: (fatte, quante) => setScarico({ tipo, fatte, totale: quante }),
      });
      salvaFile(esito.blob, nomeZip(tipo));
      setAvviso(
        esito.fallite.length
          ? `ZIP pronto con ${foto(esito.incluse)}. Non scaricate: ${esito.fallite.length}.`
          : `ZIP pronto con ${foto(esito.incluse)}.`
      );
      if (!esito.fallite.length) setScelte(new Map());
    } catch (problema) {
      setAvviso(problema instanceof DownloadAnnullato ? "Download annullato" : messaggioErrore(problema));
    } finally {
      annullaScarico.current = null;
      setScarico(null);
    }
  };

  const filtriAttivi = contaFiltriAttivi({ ...filtri, testo });
  const altreDisponibili = stato === "pronto" && immagini.length < totale;
  const quanteScelte = scelte.size;
  const troppeLeggere = quanteScelte > MAX_LEGGERE;
  const troppiOriginali = quanteScelte > MAX_ORIGINALI;

  const selezione = (
    etichetta: string,
    campo: "collezione" | "tipologia" | "colore" | "contesto" | "shooting",
    voci: string[],
    tutte: string
  ) => (
    <label className={styles.campo}>
      <span className={styles.campoEtichetta}>{etichetta}</span>
      <select
        className={styles.selezione}
        value={filtri[campo]}
        onChange={(evento) => cambia({ [campo]: evento.target.value })}
      >
        <option value="">{tutte}</option>
        {filtri[campo] && !voci.includes(filtri[campo]) ? <option value={filtri[campo]}>{filtri[campo]}</option> : null}
        {voci.map((voce) => <option key={voce} value={voce}>{voce}</option>)}
      </select>
    </label>
  );

  return (
    <main className={styles.pagina} data-selezione={quanteScelte > 0 ? "si" : "no"}>
      <header className={styles.testata}>
        <Brand context="Archivio immagini" />
        <a className={styles.linkWorkspace} href="/dashboard">Workspace</a>
      </header>

      <section className={styles.intro} aria-labelledby="archivio-ai-titolo">
        <div>
          <h1 id="archivio-ai-titolo" className={styles.titolo}>{inRevisione ? "Revisione" : "Archivio immagini"}</h1>
          <p className={styles.sottotitolo}>
            {inRevisione
              ? "Le foto che l'AI non ha riconosciuto con sicurezza, e quelle nascoste. Conferma il prodotto, correggilo o nascondi la foto."
              : "Le foto degli shooting True Design. Cerca, guarda in grande e scarica."}
          </p>
        </div>

        {admin ? (
          <div className={styles.viste} role="group" aria-label="Area">
            <button type="button" className={styles.vista} aria-pressed={!inRevisione} onClick={() => cambia({ vista: "visibili" })}>
              Archivio
              {opzioni ? <span className={styles.vistaConteggio}>{numero(opzioni.conteggi.visibili)}</span> : null}
            </button>
            <button type="button" className={styles.vista} aria-pressed={inRevisione} onClick={() => { if (!inRevisione) cambia({ vista: "da-rivedere" }); }}>
              Revisione
              {opzioni ? <span className={styles.vistaConteggio}>{numero(opzioni.conteggi.daRivedere)}</span> : null}
            </button>
          </div>
        ) : null}
      </section>

      <section className={styles.strumenti} aria-label="Ricerca e filtri">
        <div className={styles.ricerca}>
          <span className={styles.ricercaIcona}><IconaCerca /></span>
          <input
            className={styles.ricercaCampo}
            type="search"
            value={testo}
            onChange={(evento) => setTesto(evento.target.value)}
            placeholder="Cerca collezione, prodotto, colore…"
            aria-label="Cerca nell'archivio"
            autoComplete="off"
            spellCheck={false}
          />
          {testo ? (
            <button type="button" className={styles.ricercaPulisci} onClick={() => setTesto("")} aria-label="Cancella il testo">
              <IconaChiudi />
            </button>
          ) : null}
        </div>

        <div className={styles.filtri}>
          {selezione("Collezione", "collezione", opzioni?.collezioni ?? [], "Tutte")}
          {selezione("Tipologia", "tipologia", opzioni?.tipologie ?? [], "Tutte")}
          {selezione("Colore", "colore", opzioni?.colori ?? [], "Tutti")}
          {selezione("Ambiente", "contesto", opzioni?.contesti ?? [], "Tutti")}
          {selezione("Shooting", "shooting", opzioni?.shooting ?? [], "Tutti")}
        </div>
      </section>

      <div className={styles.barra}>
        {inRevisione ? (
          <div className={styles.sottoviste} role="group" aria-label="Quali foto rivedere">
            {VISTE_REVISIONE.map((vista) => {
              const conteggio = conteggioVista(opzioni, vista.id);
              return (
                <button
                  key={vista.id}
                  type="button"
                  className={styles.sottovista}
                  aria-pressed={filtri.vista === vista.id}
                  onClick={() => cambia({ vista: vista.id })}
                >
                  {vista.etichetta}
                  {conteggio !== null ? <span className={styles.vistaConteggio}>{numero(conteggio)}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className={styles.riepilogo}>
          <p className={styles.totale} aria-live="polite">
            {stato === "carica" ? "Ricerca in corso…" : stato === "errore" ? "" : foto(totale)}
          </p>
          {filtriAttivi > 0 ? (
            <button type="button" className={styles.azzera} onClick={azzera}>Azzera filtri</button>
          ) : null}
        </div>
      </div>

      {stato === "errore" ? (
        <div className={styles.vuoto} role="alert">
          <h2 className={styles.vuotoTitolo}>Non riesco a leggere l&rsquo;archivio</h2>
          <p className={styles.vuotoTesto}>{errore}</p>
          <button type="button" className={styles.bottone} onClick={() => setTentativo((attuale) => attuale + 1)}>Riprova</button>
        </div>
      ) : null}

      {stato === "carica" ? (
        <ul className={styles.griglia} aria-hidden="true">
          {Array.from({ length: 12 }, (_, indice) => (
            <li key={indice} className={styles.segnaposto}><span className={styles.segnapostoFoto} /><span className={styles.segnapostoRiga} /></li>
          ))}
        </ul>
      ) : null}

      {stato === "pronto" && immagini.length === 0 ? (
        <div className={styles.vuoto}>
          <h2 className={styles.vuotoTitolo}>{inRevisione && filtriAttivi === 0 ? "Niente da rivedere" : "Nessuna foto trovata"}</h2>
          <p className={styles.vuotoTesto}>
            {filtriAttivi > 0 ? "Prova con meno filtri o con un'altra parola." : inRevisione ? "Qui compaiono le foto che aspettano una tua decisione." : "L'archivio è ancora vuoto."}
          </p>
          {filtriAttivi > 0 ? <button type="button" className={styles.bottone} onClick={azzera}>Azzera filtri</button> : null}
        </div>
      ) : null}

      {stato === "pronto" && immagini.length > 0 ? (
        <ul className={styles.griglia}>
          {immagini.map((immagine) => {
            const top = riconoscimentoTop(immagine);
            const indirizzo = immagine.miniaturaPath ? link[immagine.miniaturaPath] : undefined;
            const nome = top.collezione ?? "Senza collezione";
            const scelta = scelte.has(immagine.id);
            return (
              <li key={immagine.id} className={styles.carta} data-scelta={scelta ? "si" : "no"}>
                <button
                  type="button"
                  id={`archivio-ai-foto-${immagine.id}`}
                  className={styles.cartaApri}
                  onClick={() => apri(immagine.id)}
                  aria-label={`${nome}, ${immagine.nomeFile}. Apri la foto`}
                >
                  <span className={styles.cartaFoto}>
                    {indirizzo ? (
                      <img
                        src={indirizzo}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        data-caricata={caricate[immagine.id] ? "si" : "no"}
                        onLoad={() => setCaricate((attuali) => (attuali[immagine.id] ? attuali : { ...attuali, [immagine.id]: true }))}
                        onError={() => rinnovaLink(immagine.miniaturaPath)}
                      />
                    ) : null}
                    {filtri.vista === "tutte" && !immagine.visibile ? <span className={styles.cartaStato}>{etichettaStato(immagine)}</span> : null}
                  </span>
                  <span className={styles.cartaTesto}>
                    <span className={styles.cartaNome}>{nome}</span>
                    {inRevisione ? <span className={styles.cartaAccuratezza}>{percentuale(top.accuratezza)}</span> : null}
                  </span>
                  <span className={styles.cartaDettaglio}>{dettaglioCarta(immagine)}</span>
                </button>
                <label className={styles.cartaScelta}>
                  <input
                    type="checkbox"
                    checked={scelta}
                    onChange={(evento) => scegli(immagine, evento.target.checked)}
                    aria-label={`Seleziona ${immagine.nomeFile} per il download`}
                  />
                  <span aria-hidden="true"><IconaSpunta /></span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      {altreDisponibili ? (
        <div className={styles.altre}>
          <p className={styles.altreTesto}>{numero(immagini.length)} di {numero(totale)}</p>
          <button type="button" className={styles.bottone} onClick={caricaPaginaSuccessiva} disabled={caricaAltre}>
            {caricaAltre ? "Carico…" : `Mostra altre ${Math.min(PER_PAGINA, totale - immagini.length)}`}
          </button>
        </div>
      ) : null}

      {aperta ? (
        <SchedaImmagine
          immagine={aperta}
          anteprima={aperta.anteprimaPath ? link[aperta.anteprimaPath] : undefined}
          miniatura={aperta.miniaturaPath ? link[aperta.miniaturaPath] : undefined}
          admin={admin}
          revisionePrima={inRevisione}
          originaliDallApp={originaliDallApp}
          prodotti={prodotti}
          posizione={`${numero(indiceAperta + 1)} di ${numero(totale)}`}
          haPrecedente={indiceAperta > 0}
          haSuccessiva={indiceAperta < immagini.length - 1}
          scelta={scelte.has(aperta.id)}
          onScelta={(accesa) => scegli(aperta, accesa)}
          onPrecedente={() => vaiA(-1)}
          onSuccessiva={() => vaiA(1)}
          onChiudi={chiudi}
          onStato={(nuovo, fatto) => revisiona(aperta, () => repository.cambiaStato(aperta.id, nuovo), fatto)}
          onCorreggi={(prodotto) => revisiona(aperta, () => repository.correggiProdotto(aperta.id, prodotto), "Prodotto corretto e foto approvata")}
          onRipristina={() => revisiona(aperta, () => repository.ripristinaAi(aperta), "Valori dell'AI ripristinati")}
          onScaricaLeggera={() => scaricaUnaLeggera(aperta)}
        />
      ) : null}

      {quanteScelte > 0 ? (
        <div className={styles.barraScelte} role="region" aria-label="Foto selezionate">
          {scarico ? (
            <>
              <p className={styles.barraScelteTesto} aria-live="polite">
                Preparo lo ZIP… {numero(scarico.fatte)} di {numero(scarico.totale)}
              </p>
              <span className={styles.avanzamento} aria-hidden="true">
                <span style={{ width: `${scarico.totale ? (scarico.fatte / scarico.totale) * 100 : 0}%` }} />
              </span>
              <button type="button" className={styles.bottoneChiaro} onClick={() => annullaScarico.current?.abort()}>Annulla</button>
            </>
          ) : (
            <>
              <p className={styles.barraScelteTesto}>
                <strong>{foto(quanteScelte)}</strong> {quanteScelte === 1 ? "selezionata" : "selezionate"}
              </p>
              <div className={styles.barraScelteAzioni}>
                <button
                  type="button"
                  className={styles.bottoneChiaro}
                  data-tono="pieno"
                  onClick={() => scaricaScelte("leggere")}
                  disabled={troppeLeggere}
                  title={troppeLeggere ? `Al massimo ${MAX_LEGGERE} foto per volta` : undefined}
                >
                  <IconaScarica />Versione leggera
                </button>
                {originaliDallApp ? (
                  <button
                    type="button"
                    className={styles.bottoneChiaro}
                    onClick={() => scaricaScelte("originali")}
                    disabled={troppiOriginali}
                    title={troppiOriginali ? `Al massimo ${MAX_ORIGINALI} originali per volta` : undefined}
                  >
                    <IconaScarica />Originali
                  </button>
                ) : null}
                {immagini.some((immagine) => !scelte.has(immagine.id)) ? (
                  <button type="button" className={styles.barraScelteLink} onClick={scegliMostrate}>Seleziona tutte le mostrate</button>
                ) : null}
                <button type="button" className={styles.barraScelteLink} onClick={() => setScelte(new Map())}>Togli la selezione</button>
              </div>
              {originaliDallApp && troppiOriginali ? (
                <p className={styles.barraScelteNota}>Gli originali si scaricano al massimo {MAX_ORIGINALI} per volta.</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <p className={styles.avviso} role="status" aria-live="polite" data-visibile={avviso ? "si" : "no"} data-alto={quanteScelte > 0 ? "si" : "no"}>{avviso}</p>
    </main>
  );
}
