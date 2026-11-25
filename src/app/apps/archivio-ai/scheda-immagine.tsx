"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ImmagineArchivio, ProdottoAddestrato, Riconoscimento, StatoRevisione } from "./data/tipi";
import {
  SOGLIA,
  correttaAMano,
  dataBreve,
  dimensioni,
  etichettaStato,
  percentuale,
  peso,
  riconoscimentoTop,
} from "./domain/formato";
import { linkDrive } from "./domain/originale";
import { indirizzoOriginale } from "./domain/scarica";
import {
  IconaAvanti,
  IconaChiudi,
  IconaEsterno,
  IconaIndietro,
  IconaIngrandisci,
  IconaNascondi,
  IconaScarica,
  IconaSpunta,
} from "./icone";
import styles from "./archivio-ai.module.css";

interface Props {
  immagine: ImmagineArchivio;
  anteprima?: string;
  miniatura?: string;
  admin: boolean;
  /** Nell'area di revisione i comandi per approvare vengono prima del download. */
  revisionePrima: boolean;
  originaliDallApp: boolean;
  prodotti: ProdottoAddestrato[];
  posizione: string;
  haPrecedente: boolean;
  haSuccessiva: boolean;
  scelta: boolean;
  onScelta(accesa: boolean): void;
  onPrecedente(): void;
  onSuccessiva(): void;
  onChiudi(): void;
  onStato(nuovo: StatoRevisione, fatto: string): Promise<void>;
  onCorreggi(collezione: string): Promise<void>;
  onRipristina(): Promise<void>;
  onScaricaLeggera(): Promise<void>;
}

type StatoOriginale = { stato: "no" | "carica" | "pronto" | "errore"; indirizzo?: string };

const COLORI: Record<string, string> = {
  beige: "#d8c6a5",
  marrone: "#7a5638",
  rosso: "#a8483c",
  bianco: "#f6f3ec",
  grigio: "#9a9a96",
  nero: "#1d1d1f",
  blu: "#3f5873",
  verde: "#5d7359",
  giallo: "#d8ad55",
  rosa: "#d9a9a0",
  arancione: "#c9793f",
  viola: "#6f5a7a",
};

const SOGLIA_TESTO = `${Math.round(SOGLIA * 100)}%`;

const spiegazioneStato = (immagine: ImmagineArchivio) => {
  if (immagine.stato === "approvata") return "Approvata: tutti la vedono in archivio.";
  if (immagine.stato === "nascosta") return "Nascosta: non compare in archivio.";
  return immagine.sopraSoglia
    ? `In archivio da sola: il riconoscimento supera il ${SOGLIA_TESTO}.`
    : `Fuori dall'archivio: il riconoscimento è sotto il ${SOGLIA_TESTO}.`;
};

const uguali = (a: Riconoscimento, b: Riconoscimento) =>
  (a.prodotto ?? "") === (b.prodotto ?? "") && (a.accuratezza ?? null) === (b.accuratezza ?? null);

const messaggioErrore = (errore: unknown) =>
  errore instanceof Error && errore.message ? errore.message : "Operazione non riuscita.";

function RigaRiconoscimento({ titolo, valore, ai }: { titolo: string; valore: Riconoscimento; ai?: Riconoscimento }) {
  const nome = valore.collezione ?? valore.prodotto;
  if (!nome) return null;
  const frazione = Math.min(1, Math.max(0, valore.accuratezza ?? 0));
  return (
    <div className={styles.riconoscimento}>
      <div className={styles.riconoscimentoTesta}>
        <span className={styles.riconoscimentoTitolo}>{titolo}</span>
        <span className={styles.riconoscimentoValore}>{percentuale(valore.accuratezza)}</span>
      </div>
      <p className={styles.riconoscimentoNome}>{nome}</p>
      <span className={styles.misura} aria-hidden="true">
        <span className={styles.misuraValore} style={{ width: `${frazione * 100}%` }} data-sopra={frazione >= SOGLIA ? "si" : "no"} />
        <span className={styles.misuraSoglia} style={{ left: `${SOGLIA * 100}%` }} />
      </span>
      {ai ? (
        <p className={styles.riconoscimentoAi}>
          Corretta a mano. L&rsquo;AI aveva indicato {ai.collezione ?? "nessuna collezione"} ({percentuale(ai.accuratezza)}).
        </p>
      ) : null}
    </div>
  );
}

export function SchedaImmagine({
  immagine,
  anteprima,
  miniatura,
  admin,
  revisionePrima,
  originaliDallApp,
  prodotti,
  posizione,
  haPrecedente,
  haSuccessiva,
  scelta,
  onScelta,
  onPrecedente,
  onSuccessiva,
  onChiudi,
  onStato,
  onCorreggi,
  onRipristina,
  onScaricaLeggera,
}: Props) {
  const pannello = useRef<HTMLDivElement>(null);
  const [occupato, setOccupato] = useState("");
  const [errore, setErrore] = useState("");
  const [sceltaProdotto, setSceltaProdotto] = useState("");
  const [grandeCaricata, setGrandeCaricata] = useState(false);
  const [ingrandita, setIngrandita] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [originale, setOriginale] = useState<StatoOriginale>({ stato: "no" });
  const indirizzoDaLiberare = useRef<string | null>(null);
  const idCorrente = useRef(immagine.id);
  idCorrente.current = immagine.id;

  const azioni = useRef({ onChiudi, onPrecedente, onSuccessiva, haPrecedente, haSuccessiva, ingrandita });
  azioni.current = { onChiudi, onPrecedente, onSuccessiva, haPrecedente, haSuccessiva, ingrandita };

  const liberaOriginale = () => {
    if (indirizzoDaLiberare.current) URL.revokeObjectURL(indirizzoDaLiberare.current);
    indirizzoDaLiberare.current = null;
  };

  useEffect(() => {
    setErrore("");
    setSceltaProdotto("");
    setOccupato("");
    setGrandeCaricata(false);
    setZoom(false);
    setOriginale({ stato: "no" });
    liberaOriginale();
  }, [immagine.id]);

  useEffect(() => liberaOriginale, []);

  useEffect(() => {
    const precedente = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pannello.current?.focus();
    return () => { document.body.style.overflow = precedente; };
  }, []);

  useEffect(() => {
    const tasto = (evento: KeyboardEvent) => {
      const attuali = azioni.current;
      if (evento.key === "Escape") {
        evento.preventDefault();
        if (attuali.ingrandita) setIngrandita(false);
        else attuali.onChiudi();
        return;
      }

      const bersaglio = evento.target as HTMLElement | null;
      const inCampo = bersaglio ? ["INPUT", "SELECT", "TEXTAREA"].includes(bersaglio.tagName) : false;
      if (!inCampo && evento.key === "ArrowLeft" && attuali.haPrecedente) attuali.onPrecedente();
      if (!inCampo && evento.key === "ArrowRight" && attuali.haSuccessiva) attuali.onSuccessiva();

      if (evento.key === "Tab" && pannello.current) {
        const attivabili = [...pannello.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])")]
          .filter((elemento) => elemento.offsetParent !== null);
        if (!attivabili.length) return;
        const primo = attivabili[0];
        const ultimo = attivabili[attivabili.length - 1];
        const attivo = document.activeElement;
        if (evento.shiftKey && (attivo === primo || attivo === pannello.current)) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && attivo === ultimo) {
          evento.preventDefault();
          primo.focus();
        }
      }
    };
    document.addEventListener("keydown", tasto);
    return () => document.removeEventListener("keydown", tasto);
  }, []);

  const collezioni = useMemo(
    () => [...new Set(prodotti.map((prodotto) => prodotto.collezione))].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" })),
    [prodotti]
  );

  const esegui = async (nome: string, azione: () => Promise<unknown>) => {
    setOccupato(nome);
    setErrore("");
    try {
      await azione();
    } catch (problema) {
      setErrore(messaggioErrore(problema));
    } finally {
      setOccupato("");
    }
  };

  const caricaOriginale = async () => {
    const id = immagine.id;
    setOriginale({ stato: "carica" });
    try {
      const risposta = await fetch(indirizzoOriginale(immagine.idDrive), { cache: "no-store" });
      if (!risposta.ok) throw new Error("non disponibile");
      const indirizzo = URL.createObjectURL(await risposta.blob());
      if (id !== idCorrente.current) {
        URL.revokeObjectURL(indirizzo);
        return;
      }
      liberaOriginale();
      indirizzoDaLiberare.current = indirizzo;
      setOriginale({ stato: "pronto", indirizzo });
    } catch {
      setOriginale({ stato: "errore" });
    }
  };

  const sceltaDiversa = Boolean(sceltaProdotto) && sceltaProdotto !== immagine.principale.collezione;
  const corretta = correttaAMano(immagine);
  const diversaDaAi = !uguali(immagine.principale, immagine.principaleAi) || !uguali(immagine.secondario, immagine.secondarioAi);
  const titolo = immagine.collezioneTop ?? riconoscimentoTop(immagine).collezione ?? "Senza collezione";
  const testoAlternativo = immagine.descrizione || `${titolo}, ${immagine.nomeFile}`;
  const pesoOriginale = peso(immagine.pesoOriginaleByte);
  const dettagli: [string, string][] = [
    ["File", immagine.nomeFile],
    ["Shooting", [immagine.nomeShooting, admin ? immagine.tipologiaShooting : ""].filter(Boolean).join(" · ")],
    ["Originale", [dimensioni(immagine), pesoOriginale].filter(Boolean).join(" · ")],
    ["In archivio dal", dataBreve(immagine.creataIl)],
  ];
  const fotoGrande = originale.stato === "pronto" && originale.indirizzo ? originale.indirizzo : anteprima;
  const testoGrande =
    originale.stato === "pronto" ? "Originale a piena risoluzione"
      : originale.stato === "carica" ? "Carico l'originale…"
      : originale.stato === "errore" ? "L'originale non si può mostrare qui: scaricalo."
      : zoom ? "Clicca per rimpicciolire" : "Clicca sulla foto per ingrandire";

  const bloccoScarica = (
    <section className={styles.blocco} aria-label="Scarica">
      <h3 className={styles.bloccoTitolo}>Scarica</h3>
      <div className={styles.azioni}>
        <a className={styles.bottone} data-tono="pieno" href={indirizzoOriginale(immagine.idDrive)} target="_blank" rel="noopener">
          <IconaScarica />{originaliDallApp ? "Originale" : "Originale su Drive"}
        </a>
        {immagine.anteprimaPath ? (
          <button type="button" className={styles.bottone} onClick={() => esegui("leggera", onScaricaLeggera)} disabled={Boolean(occupato)}>
            <IconaScarica />{occupato === "leggera" ? "Preparo…" : "Versione leggera"}
          </button>
        ) : null}
      </div>
      <p className={styles.nota}>
        L&rsquo;originale è il file a piena risoluzione{pesoOriginale ? ` (${pesoOriginale})` : ""}. La versione leggera è un JPEG da 1600 pixel, adatto a presentazioni ed email.
      </p>
      <label className={styles.sceltaRiga}>
        <input type="checkbox" checked={scelta} onChange={(evento) => onScelta(evento.target.checked)} />
        <span>Aggiungi alla selezione, per scaricare più foto insieme</span>
      </label>
      {!admin && errore ? <p className={styles.errore} role="alert">{errore}</p> : null}
    </section>
  );

  const bloccoProdotti = admin ? (
    <>
      {!immagine.pertinente ? <p className={styles.nota}>L&rsquo;AI l&rsquo;ha segnata come foto non di arredo.</p> : null}

      <section className={styles.blocco} aria-label="Collezioni riconosciute">
        <h3 className={styles.bloccoTitolo}>Riconoscimento</h3>
        <RigaRiconoscimento titolo="Collezione principale" valore={immagine.principale} ai={corretta ? immagine.principaleAi : undefined} />
        {immagine.secondario.collezione && immagine.secondario.collezione !== immagine.principale.collezione ? (
          <RigaRiconoscimento titolo="Collezione secondaria" valore={immagine.secondario} />
        ) : null}
        {!immagine.principale.collezione && !immagine.secondario.collezione ? (
          <p className={styles.nota}>Nessuna collezione riconosciuta.</p>
        ) : null}
        {immagine.inAddestramento ? <p className={styles.nota}>Questa foto è anche tra quelle di addestramento.</p> : null}
      </section>

      <section className={styles.blocco} aria-label="Revisione">
        <h3 className={styles.bloccoTitolo}>Revisione</h3>
        <p className={styles.bloccoTesto}>{spiegazioneStato(immagine)}</p>
        <div className={styles.azioni}>
          {immagine.stato !== "approvata" ? (
            <button type="button" className={styles.bottone} data-tono="pieno" disabled={Boolean(occupato)} onClick={() => esegui("approva", () => onStato("approvata", "Foto approvata"))}>
              <IconaSpunta />{occupato === "approva" ? "Salvo…" : "Approva"}
            </button>
          ) : null}
          {immagine.stato !== "nascosta" ? (
            <button type="button" className={styles.bottone} disabled={Boolean(occupato)} onClick={() => esegui("nascondi", () => onStato("nascosta", "Foto nascosta"))}>
              <IconaNascondi />{occupato === "nascondi" ? "Salvo…" : "Nascondi"}
            </button>
          ) : null}
          {immagine.stato !== "auto" ? (
            <button type="button" className={styles.bottoneTesto} disabled={Boolean(occupato)} onClick={() => esegui("auto", () => onStato("auto", "Revisione tolta"))}>
              {occupato === "auto" ? "Salvo…" : "Togli la revisione"}
            </button>
          ) : null}
        </div>

        {prodotti.length ? (
          <div className={styles.correzione}>
            <label className={styles.campo}>
              <span className={styles.campoEtichetta}>La collezione è un&rsquo;altra?</span>
              <select className={styles.selezione} value={sceltaProdotto} onChange={(evento) => setSceltaProdotto(evento.target.value)} disabled={Boolean(occupato)}>
                <option value="">Scegli la collezione giusta</option>
                {collezioni.map((collezione) => <option key={collezione} value={collezione}>{collezione}</option>)}
              </select>
            </label>
            <button
              type="button"
              className={styles.bottone}
              disabled={!sceltaDiversa || Boolean(occupato)}
              onClick={() => sceltaProdotto && esegui("correggi", () => onCorreggi(sceltaProdotto).then(() => setSceltaProdotto("")))}
            >
              {occupato === "correggi" ? "Salvo…" : "Correggi e approva"}
            </button>
          </div>
        ) : null}

        {diversaDaAi ? (
          <button type="button" className={styles.bottoneTesto} disabled={Boolean(occupato)} onClick={() => esegui("ripristina", onRipristina)}>
            {occupato === "ripristina" ? "Salvo…" : "Ripristina i valori dell'AI"}
          </button>
        ) : null}

        {errore ? <p className={styles.errore} role="alert">{errore}</p> : null}
      </section>
    </>
  ) : null;

  return (
    <div className={styles.velo} onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onChiudi(); }}>
      <div
        ref={pannello}
        className={styles.scheda}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archivio-ai-scheda-titolo"
        tabIndex={-1}
      >
        <div className={styles.schedaFoto}>
          {miniatura ? (
            <img className={styles.schedaFotoBozza} src={miniatura} alt="" aria-hidden="true" data-nascosta={anteprima && grandeCaricata ? "si" : "no"} />
          ) : null}
          {anteprima ? (
            <img
              key={anteprima}
              className={styles.schedaFotoGrande}
              src={anteprima}
              alt={testoAlternativo}
              data-caricata={grandeCaricata ? "si" : "no"}
              onLoad={() => setGrandeCaricata(true)}
              onClick={() => setIngrandita(true)}
            />
          ) : null}
          {!grandeCaricata ? <span className={styles.caricamento} role="status" aria-label="Carico la foto" /> : null}

          <button type="button" className={styles.apriGrande} onClick={() => setIngrandita(true)} aria-label="Guarda la foto a tutto schermo">
            <IconaIngrandisci />
          </button>

          <div className={styles.schedaNavigazione}>
            <button type="button" className={styles.tondo} onClick={onPrecedente} disabled={!haPrecedente} aria-label="Foto precedente">
              <IconaIndietro />
            </button>
            <span className={styles.schedaPosizione}>{posizione}</span>
            <button type="button" className={styles.tondo} onClick={onSuccessiva} disabled={!haSuccessiva} aria-label="Foto successiva">
              <IconaAvanti />
            </button>
          </div>
        </div>

        <div className={styles.schedaDati}>
          <div className={styles.schedaTesta}>
            <div>
              {admin ? (
                <p className={styles.schedaStato} data-stato={immagine.visibile ? "visibile" : "fuori"}>{etichettaStato(immagine)}</p>
              ) : null}
              <h2 id="archivio-ai-scheda-titolo" className={styles.schedaTitolo}>{titolo}</h2>
            </div>
            <button type="button" className={styles.tondo} onClick={onChiudi} aria-label="Chiudi la foto">
              <IconaChiudi />
            </button>
          </div>

          {immagine.descrizione ? <p className={styles.schedaDescrizione}>{immagine.descrizione}</p> : null}

          {immagine.tipologie.length || immagine.colori.length || immagine.contesto ? (
            <ul className={styles.etichette} aria-label="Caratteristiche">
              {immagine.contesto ? <li className={styles.etichetta}>{immagine.contesto}</li> : null}
              {immagine.tipologie.map((voce) => <li key={`t-${voce}`} className={styles.etichetta}>{voce}</li>)}
              {immagine.colori.map((voce) => (
                <li key={`c-${voce}`} className={styles.etichetta}>
                  <span className={styles.campione} style={{ background: COLORI[voce] ?? "linear-gradient(135deg, #d8ad55, #a8483c 50%, #3f5873)" }} aria-hidden="true" />
                  {voce}
                </li>
              ))}
            </ul>
          ) : null}

          {revisionePrima ? <>{bloccoProdotti}{bloccoScarica}</> : <>{bloccoScarica}{bloccoProdotti}</>}

          <section className={styles.blocco} aria-label="Informazioni sul file">
            <h3 className={styles.bloccoTitolo}>Informazioni</h3>
            <dl className={styles.dettagli}>
              {dettagli.filter(([, valore]) => valore).map(([etichetta, valore]) => (
                <div key={etichetta} className={styles.dettaglio}>
                  <dt>{etichetta}</dt>
                  <dd>{valore}</dd>
                </div>
              ))}
            </dl>
            {admin ? (
              <a className={styles.bottoneTesto} href={linkDrive(immagine.idDrive)} target="_blank" rel="noopener noreferrer">
                Apri in Drive<IconaEsterno />
              </a>
            ) : null}
          </section>
        </div>

        {ingrandita ? (
          <div className={styles.grande} data-zoom={zoom ? "si" : "no"}>
            <div className={styles.grandeArea} onClick={(evento) => { if (evento.target === evento.currentTarget) setIngrandita(false); }}>
              {fotoGrande ? (
                <img
                  src={fotoGrande}
                  alt={testoAlternativo}
                  onClick={() => setZoom((attuale) => !attuale)}
                  onError={() => { if (originale.stato === "pronto") setOriginale({ stato: "errore" }); }}
                />
              ) : null}
            </div>
            <div className={styles.grandeBarra}>
              <p className={styles.grandeTesto} aria-live="polite">{testoGrande}</p>
              {originaliDallApp && originale.stato === "no" ? (
                <button type="button" className={styles.bottoneChiaro} onClick={caricaOriginale}>Carica l&rsquo;originale</button>
              ) : null}
              <button type="button" className={styles.bottoneChiaro} onClick={() => setIngrandita(false)}>
                <IconaChiudi />Chiudi
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
