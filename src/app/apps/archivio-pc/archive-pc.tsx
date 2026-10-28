"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo_true.svg";
import styles from "./archive-pc.module.css";
import {
  filterPcs,
  summarizePcs,
  uniqueValues,
  type PcFilters,
  type PcRecord,
  type PcSort,
} from "./domain/archive";
import { pcImages } from "./image-map";

const EMPTY_FILTERS: PcFilters = { query: "", area: "", type: "", sort: "assignee" };

const DETAIL_FIELDS: Array<[keyof PcRecord, string]> = [
  ["area", "Area"],
  ["tipologia", "Tipologia"],
  ["marca", "Marca"],
  ["modello", "Modello"],
  ["anno", "Anno"],
  ["numero_serie", "Numero di serie"],
  ["processore", "Processore"],
  ["ram", "Memoria"],
  ["gpu", "Scheda grafica"],
  ["schermo", "Schermo"],
  ["archiviazione", "Archiviazione"],
  ["sistema_operativo", "Sistema operativo"],
  ["versione_os", "Versione OS"],
  ["data_installazione_os", "Installazione OS"],
  ["data_acquisto", "Data acquisto"],
  ["aggiornata", "Ultimo aggiornamento"],
  ["note", "Note"],
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  );
}

function PcVisual({ pc, priority = false }: { pc: PcRecord; priority?: boolean }) {
  const image = pcImages[pc.foto];
  if (!image) {
    return (
      <div className={styles.imageFallback} aria-label={`Immagine non disponibile per ${pc.modello}`}>
        <span>{pc.marca}</span>
        <strong>{pc.modello}</strong>
      </div>
    );
  }

  return (
    <Image
      src={image}
      alt={`${pc.marca} ${pc.modello}`}
      className={styles.deviceImage}
      sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
      priority={priority}
    />
  );
}

export function ArchivioPc({ pcs }: { pcs: PcRecord[] }) {
  const [filters, setFilters] = useState<PcFilters>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePc, setActivePc] = useState<PcRecord | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const summary = useMemo(() => summarizePcs(pcs), [pcs]);
  const areas = useMemo(() => uniqueValues(pcs, "area"), [pcs]);
  const types = useMemo(() => uniqueValues(pcs, "tipologia"), [pcs]);
  const visiblePcs = useMemo(() => filterPcs(pcs, filters), [pcs, filters]);
  const selectedPcs = useMemo(() => pcs.filter((pc) => selectedIds.has(pc.id)), [pcs, selectedIds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activePc && !dialog.open) dialog.showModal();
    if (!activePc && dialog.open) dialog.close();
  }, [activePc]);

  const updateFilter = <Key extends keyof PcFilters>(key: Key, value: PcFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="https://www.truedesign.it" className={styles.brand} aria-label="True Design">
          <Image src={logo} alt="True Design" priority />
        </a>
        <span className={styles.readOnly}>Consultazione · sola lettura</span>
      </header>

      <section className={styles.hero} aria-labelledby="archive-title">
        <div>
          <p className={styles.eyebrow}>Asset digitali</p>
          <h1 id="archive-title">Archivio PC</h1>
          <p className={styles.intro}>
            Una vista chiara e condivisibile del parco macchine aziendale, aggiornata al 28 ottobre 2026.
          </p>
        </div>
        <div className={styles.heroIndex} aria-label={`${summary.total} computer censiti`}>
          <strong>{summary.total}</strong>
          <span>computer censiti</span>
        </div>
      </section>

      <section className={styles.stats} aria-label="Riepilogo archivio">
        <div><strong>{summary.notebooks}</strong><span>Notebook</span></div>
        <div><strong>{summary.total - summary.notebooks}</strong><span>Desktop e workstation</span></div>
        <div><strong>{summary.areas}</strong><span>Aree aziendali</span></div>
        <div><strong>{summary.windows11}</strong><span>Windows 11</span></div>
      </section>

      <section className={styles.controls} aria-label="Ricerca e filtri">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>Cerca nell’archivio</span>
          <SearchIcon />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="Cerca persona, modello o specifica"
          />
        </label>
        <label>
          <span className={styles.srOnly}>Filtra per area</span>
          <select value={filters.area} onChange={(event) => updateFilter("area", event.target.value)}>
            <option value="">Tutte le aree</option>
            {areas.map((area) => <option key={area}>{area}</option>)}
          </select>
        </label>
        <label>
          <span className={styles.srOnly}>Filtra per tipologia</span>
          <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
            <option value="">Tutte le tipologie</option>
            {types.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>
          <span className={styles.srOnly}>Ordina archivio</span>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value as PcSort)}>
            <option value="assignee">Ordina per assegnatario</option>
            <option value="area">Ordina per area</option>
            <option value="model">Ordina per modello</option>
            <option value="updated">Più recenti</option>
          </select>
        </label>
      </section>

      <div className={styles.resultsBar}>
        <p aria-live="polite">{visiblePcs.length} {visiblePcs.length === 1 ? "risultato" : "risultati"}</p>
        <button
          type="button"
          className={styles.printButton}
          disabled={selectedPcs.length === 0}
          onClick={() => window.print()}
        >
          <PrintIcon />
          Stampa selezione{selectedPcs.length > 0 ? ` (${selectedPcs.length})` : ""}
        </button>
      </div>

      {visiblePcs.length > 0 ? (
        <section className={styles.grid} aria-label="Computer aziendali">
          {visiblePcs.map((pc, index) => {
            const selected = selectedIds.has(pc.id);
            return (
              <article className={`${styles.card} ${selected ? styles.cardSelected : ""}`} key={pc.id}>
                <button
                  type="button"
                  className={styles.selectButton}
                  aria-pressed={selected}
                  aria-label={`${selected ? "Deseleziona" : "Seleziona"} ${pc.assegnatario}`}
                  onClick={() => toggleSelection(pc.id)}
                >
                  <span aria-hidden="true">{selected ? "✓" : ""}</span>
                </button>
                <button type="button" className={styles.cardOpen} onClick={() => setActivePc(pc)}>
                  <div className={styles.imageWrap}><PcVisual pc={pc} priority={index < 3} /></div>
                  <div className={styles.cardBody}>
                    <span className={styles.area}>{pc.area}</span>
                    <h2>{pc.assegnatario}</h2>
                    <p className={styles.model}>{pc.marca} · {pc.modello}</p>
                    <dl className={styles.quickSpecs}>
                      {pc.processore && <div><dt>CPU</dt><dd>{pc.processore}</dd></div>}
                      {pc.ram && <div><dt>RAM</dt><dd>{pc.ram}</dd></div>}
                    </dl>
                    <span className={styles.detailsLink}>Consulta scheda <span aria-hidden="true">↗</span></span>
                  </div>
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <p className={styles.eyebrow}>Nessuna corrispondenza</p>
          <h2>Prova una ricerca più ampia.</h2>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Azzera i filtri</button>
        </section>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => setActivePc(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActivePc(null);
        }}
      >
        {activePc && (
          <div className={styles.dialogPanel}>
            <button type="button" className={styles.closeButton} onClick={() => setActivePc(null)} aria-label="Chiudi scheda">×</button>
            <div className={styles.dialogVisual}><PcVisual pc={activePc} /></div>
            <div className={styles.dialogContent}>
              <p className={styles.eyebrow}>{activePc.area}</p>
              <h2>{activePc.assegnatario}</h2>
              <p className={styles.dialogModel}>{activePc.marca} · {activePc.modello}</p>
              <dl className={styles.detailList}>
                {DETAIL_FIELDS.map(([key, label]) => {
                  const value = activePc[key];
                  if (!value || key === "area" || key === "marca" || key === "modello") return null;
                  return <div key={key}><dt>{label}</dt><dd>{value}</dd></div>;
                })}
              </dl>
            </div>
          </div>
        )}
      </dialog>

      <section className={styles.printSheet} aria-hidden="true">
        <header><Image src={logo} alt="True Design" /><p>Archivio PC · 28 ottobre 2026</p></header>
        {selectedPcs.map((pc) => (
          <article key={pc.id}>
            <h2>{pc.assegnatario}</h2>
            <p>{pc.area} · {pc.marca} {pc.modello}</p>
            <dl>
              {DETAIL_FIELDS.map(([key, label]) => pc[key] ? <div key={key}><dt>{label}</dt><dd>{pc[key]}</dd></div> : null)}
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}
