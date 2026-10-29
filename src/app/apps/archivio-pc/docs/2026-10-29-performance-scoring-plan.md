# Archivio PC Performance Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere 2 PC confermati e mostrare per tutti i PC voto prestazionale, profilo, attendibilità e indicazione operativa.

**Architecture:** Estendere i record JSON con profilo e nome dispositivo; isolare benchmark e calcolo puro in `domain/performance.ts`; consumare il risultato nell'interfaccia esistente. I dati mancanti producono sottopunteggi null e riducono l'attendibilità senza abbassare il voto.

**Tech Stack:** Next.js 15, React, TypeScript, CSS Modules, Vitest.

## Global Constraints

- Nessuna nuova libreria UI o modifica Supabase.
- Tutto resta in `src/app/apps/archivio-pc/`.
- Media geometrica e pesi esatti della specifica `docs/2026-10-29-performance-scoring-design.md`.
- Ex Notebook Cristina ed Ex Notebook Gaia sono record confermati, profilo Ufficio, area non assegnata.
- TDD: ogni funzione nuova deve avere prima un test fallente osservato.

---

### Task 1: Dati e motore prestazionale

**Files:**
- Modify: `domain/archive.ts`
- Create: `domain/performance.ts`
- Create: `domain/performance.test.ts`
- Modify: `data/pcs.json`
- Modify: `domain/archive.test.ts`

**Interfaces:**
- Produce `PerformanceProfile`, `PerformanceAssessment`, `assessPerformance(pc)` e `missingPerformanceData(pc)`.

- [ ] Scrivere test fallenti per pesi, fasce, attendibilità, ricollocazione, Windows fuori supporto, Apple Silicon, disco quasi pieno e benchmark Ryzen 5 7530U.
- [ ] Eseguire `npm test -- src/app/apps/archivio-pc/domain/performance.test.ts` e osservare il fallimento per modulo mancante.
- [ ] Implementare tabelle benchmark, normalizzazione, media geometrica, indicazione e dati mancanti.
- [ ] Aggiungere `profilo` e `nome_dispositivo` al tipo e ai 35 record; aggiungere i due record confermati con ID 34 e 35.
- [ ] Aggiornare il test archivio da 33 a 35 record e verificare i due nuovi record.
- [ ] Eseguire i test di dominio e ottenere PASS.

### Task 2: Interfaccia, filtri e ordinamento

**Files:**
- Modify: `archive-pc.tsx`
- Modify: `archive-pc.module.css`
- Modify: `domain/archive.ts`
- Modify: `domain/archive.test.ts`

**Interfaces:**
- Consume `assessPerformance(pc)`.
- Extend `PcFilters` con `profile`; extend `PcSort` con `performance`.

- [ ] Scrivere test fallenti per filtro profilo e ordinamento performance crescente.
- [ ] Eseguire il test e osservare il fallimento atteso.
- [ ] Integrare filtro profilo, ordinamento, badge voto/fascia/attendibilità nelle card e pannello completo nel dialogo.
- [ ] Mostrare componenti, quattro voti di idoneità, indicazione operativa e dati mancanti.
- [ ] Aggiungere stili coerenti e responsive senza nuove dipendenze.
- [ ] Eseguire i test di dominio e ottenere PASS.

### Task 3: Verifica e pubblicazione

**Files:** tutti i file modificati dell'app.

- [ ] Eseguire `npm test`, `npm run typecheck` e `npm run build`.
- [ ] Revisionare il diff rispetto a `origin/main` e correggere difetti importanti.
- [ ] Eseguire `./scripts/pubblica.sh "aggiunge valutazione performance archivio pc"` pubblicando solo i file dell'app.
- [ ] Attendere il deploy e verificare HTTP 200 pubblico su `/apps/archivio-pc`.
- [ ] Verificare record catalogo attivo/pubblico e presenza in admin apps/assignments.
