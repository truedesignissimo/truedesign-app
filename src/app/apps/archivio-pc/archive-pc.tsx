"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo_true.svg";
import styles from "./archive-pc.module.css";
import { CpuBrand } from "./cpu-brand";
import {
  groupPcsByArea,
  summarizePcs,
  type PcRecord,
} from "./domain/archive";
import { pcImages } from "./image-map";
import { assessPerformance, PROFILE_WEIGHTS, rankReplacementPriority, type PerformanceAssessment, type PerformanceComponents, type PerformanceProfile } from "./domain/performance";

const PROFILES = Object.keys(PROFILE_WEIGHTS) as PerformanceProfile[];
const COMPONENT_LABELS: Array<[keyof PerformanceComponents, string]> = [
  ["singleCore", "CPU single-core"], ["multiCore", "CPU multi-core"], ["gpu", "GPU"],
  ["ram", "RAM"], ["storage", "Archiviazione"], ["graphicsMemory", "Memoria grafica / unificata"],
];

const DETAIL_FIELDS: Array<[keyof PcRecord, string]> = [
  ["area", "Area"],
  ["tipologia", "Tipologia"],
  ["marca", "Marca"],
  ["modello", "Modello"],
  ["nome_dispositivo", "Nome dispositivo"],
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

export function PerformanceSummary({ assessment }: { assessment: PerformanceAssessment }) {
  const tooltip = `${assessment.band} · Profilo ${assessment.profile} · Attendibilità ${assessment.confidence.toLocaleLowerCase("it")}${assessment.provisional ? " · voto provvisorio" : ""}`;
  return (
    <span className={styles.powerBadge} tabIndex={0} title={tooltip} aria-label={`Potenza ${assessment.score ?? "non disponibile"} su 100 · ${tooltip}`}>
      Potenza <strong>{assessment.score ?? "—"}</strong>
    </span>
  );
}

export function PerformanceDetail({ assessment }: { assessment: PerformanceAssessment }) {
  return (
    <section className={styles.performanceDetail} aria-label="Valutazione prestazionale">
      <h3>Valutazione prestazionale</h3>
      <div className={styles.performanceSummary}>
        <div className={styles.performanceHeading}>
          <span>Profilo {assessment.profile}</span>
          <strong>{assessment.score ?? "—"}<small>/100</small></strong>
        </div>
        <div className={styles.performanceMeta}><span>{assessment.band}</span></div>
      </div>
      <div className={styles.recommendation}>
        <span>Indicazione operativa{assessment.recommendationProvisional ? " · provvisoria" : ""}</span>
        <strong>{assessment.recommendation}</strong>
        <p>Sistema operativo: {assessment.osSupport}</p>
      </div>
      {assessment.storageWarning && <p className={styles.storageWarning}>{assessment.storageWarning}</p>}
      <h4>Componenti · punteggi su 100</h4>
      <dl className={styles.componentScores}>
        {COMPONENT_LABELS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{assessment.components[key] === null ? "Non disponibile" : Math.round(assessment.components[key]!)}</dd>
          </div>
        ))}
      </dl>
      <h4>Idoneità nei quattro profili</h4>
      <dl className={styles.profileScores}>
        {PROFILES.map((profile) => (
          <div key={profile} className={profile === assessment.profile ? styles.assignedProfile : undefined}>
            <dt>{profile}{profile === assessment.profile && <span>Assegnato</span>}</dt>
            <dd>{assessment.scoresByProfile[profile] ?? "—"}<small>/100</small></dd>
          </div>
        ))}
      </dl>
      <p className={styles.performanceNote}>I dati non disponibili sono esclusi dal voto; possono modificare la valutazione una volta completati.</p>
      <h4>Dati da completare</h4>
      {assessment.missingData.length > 0
        ? <ul className={styles.missingData}>{assessment.missingData.map((item) => <li key={item}>{item}</li>)}</ul>
        : <p className={styles.performanceNote}>Dati prestazionali completi.</p>}
    </section>
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

export function ArchiveModeToggle({ priorityOnly, onToggle }: { priorityOnly: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.priorityButton} ${priorityOnly ? styles.priorityButtonActive : ""}`}
      aria-pressed={priorityOnly}
      onClick={onToggle}
    >
      {priorityOnly ? "Mostra tutti" : "Da sostituire prima"}
    </button>
  );
}

function HardwareIcon({ kind }: { kind: "cpu" | "ram" | "gpu" | "screen" }) {
  return (
    <svg className={styles.hardwareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "cpu" && <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /></>}
      {kind === "ram" && <><rect x="3" y="6" width="18" height="11" rx="2" /><path d="M6 10h3v3H6zm6 0h3v3h-3zm6 0v3M6 17v3m4-3v3m4-3v3m4-3v3" /></>}
      {kind === "gpu" && <><rect x="3" y="5" width="18" height="13" rx="2" /><circle cx="13" cy="11.5" r="3.5" /><path d="M6 9v5m1 4v3m4-3v3m4-3v3M2 5v14" /></>}
      {kind === "screen" && <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M12 17v4m-4 0h8" /></>}
    </svg>
  );
}

export function splitRam(value: string) {
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?\s*GB)\s*(.*)$/i);
  return match
    ? { capacity: match[1], details: match[2] }
    : { capacity: value.trim(), details: "" };
}

export function RamValue({ value, compact = false }: { value: string; compact?: boolean }) {
  const ram = splitRam(value);
  return (
    <span className={styles.ramValue}>
      <span>{ram.capacity}</span>
      {!compact && ram.details && <small className={styles.ramSpeed}>{ram.details}</small>}
    </span>
  );
}

export function isUnverified(value: string) {
  return /\bda verificare\b/i.test(value);
}

function VerificationWarning() {
  return (
    <span
      className={styles.warningIcon}
      aria-label="Informazione da verificare"
      title="Informazione da verificare"
      tabIndex={0}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 22 21H2L12 3Z" />
        <path d="M12 9v5m0 3v.1" />
      </svg>
    </span>
  );
}

function HardwareSpecs({ pc }: { pc: PcRecord }) {
  return (
    <dl className={styles.quickSpecs}>
      {pc.processore && <div className={styles.cpuSpec}>
        <dt><CpuBrand processor={pc.processore} /><span className={styles.srOnly}>CPU</span></dt>
        <dd><span>{pc.processore}</span>{isUnverified(pc.processore) && <VerificationWarning />}</dd>
      </div>}
      {pc.ram && <div className={styles.ramSpec}><dt><HardwareIcon kind="ram" />RAM</dt><dd><RamValue value={pc.ram} compact />{isUnverified(pc.ram) && <VerificationWarning />}</dd></div>}
      {pc.gpu && <div><dt><HardwareIcon kind="gpu" />GPU</dt><dd><span>{pc.gpu}</span>{isUnverified(pc.gpu) && <VerificationWarning />}</dd></div>}
      {pc.schermo && <div><dt><HardwareIcon kind="screen" />Schermo</dt><dd>{pc.schermo}</dd></div>}
    </dl>
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
      sizes="180px"
      priority={priority}
    />
  );
}

export function ArchivioPc({ pcs }: { pcs: PcRecord[] }) {
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePc, setActivePc] = useState<PcRecord | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const summary = useMemo(() => summarizePcs(pcs), [pcs]);
  const priorityPcs = useMemo(() => rankReplacementPriority(pcs), [pcs]);
  const visiblePcs = priorityOnly ? priorityPcs : pcs;
  const groups = useMemo(() => groupPcsByArea(visiblePcs), [visiblePcs]);
  const selectedPcs = useMemo(() => pcs.filter((pc) => selectedIds.has(pc.id)), [pcs, selectedIds]);
  const assessments = useMemo(() => new Map(pcs.map((pc) => [pc.id, assessPerformance(pc)])), [pcs]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activePc && !dialog.open) dialog.showModal();
    if (!activePc && dialog.open) dialog.close();
  }, [activePc]);

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
            Una vista chiara e condivisibile del parco macchine aziendale, aggiornata al 29 ottobre 2026.
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

      <div className={styles.resultsBar}>
        <div className={styles.viewControl}>
          <ArchiveModeToggle priorityOnly={priorityOnly} onToggle={() => setPriorityOnly((current) => !current)} />
          <p aria-live="polite">{priorityOnly ? `${visiblePcs.length} priorità su ${pcs.length} PC` : `${pcs.length} PC censiti`}</p>
        </div>
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
        <section className={styles.departments} aria-label="Computer aziendali">
          {groups.map((group, groupIndex) => (
            <section className={styles.department} key={group.area} aria-label={group.area}>
              <header className={styles.departmentHeading}>
                <span className={styles.departmentIndex}>{String(groupIndex + 1).padStart(2, "0")}</span>
                <h2>{group.area}</h2>
                <span className={styles.departmentCount}>{group.pcs.length} PC</span>
              </header>
              <div className={styles.grid}>
                {group.pcs.map((pc, index) => {
                  const selected = selectedIds.has(pc.id);
                  return (
                    <article className={`${styles.card} ${selected ? styles.cardSelected : ""}`} key={pc.id}>
                      <PerformanceSummary assessment={assessments.get(pc.id)!} />
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
                        <div className={styles.imageWrap}><PcVisual pc={pc} priority={groupIndex === 0 && index < 4} /></div>
                        <div className={styles.cardBody}>
                          <span className={styles.deviceType}>{pc.tipologia}</span>
                          <h3>{pc.assegnatario}</h3>
                          <p className={styles.model}>{pc.marca} · {pc.modello}</p>
                          <HardwareSpecs pc={pc} />
                          <span className={styles.detailsLink}>Consulta scheda <span aria-hidden="true">↗</span></span>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <p className={styles.eyebrow}>Nessun dato disponibile</p>
          <h2>{priorityOnly ? "Completa i dati prestazionali per creare la priorità." : "L’archivio è vuoto."}</h2>
        </section>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="pc-detail-title"
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
              <p className={styles.eyebrow}>{activePc.area || "Area da assegnare"}</p>
              <h2 id="pc-detail-title">{activePc.assegnatario}</h2>
              <p className={styles.dialogModel}>{activePc.marca} · {activePc.modello}</p>
              <PerformanceDetail assessment={assessments.get(activePc.id)!} />
              <dl className={styles.detailList}>
                {DETAIL_FIELDS.map(([key, label]) => {
                  const value = activePc[key];
                  if (!value || key === "area" || key === "marca" || key === "modello") return null;
                  return <div key={key}><dt>{label}</dt><dd>{key === "ram" ? <RamValue value={String(value)} /> : value}</dd></div>;
                })}
              </dl>
            </div>
          </div>
        )}
      </dialog>

      <section className={styles.printSheet} aria-hidden="true">
        <header><Image src={logo} alt="True Design" /><p>Archivio PC · 29 ottobre 2026</p></header>
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
