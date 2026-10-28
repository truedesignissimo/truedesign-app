# Archivio PC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pubblicare `/apps/archivio-pc` come archivio responsive, pubblico e in sola lettura dei PC aziendali.

**Architecture:** Una route Next.js server carica un dataset JSON statico tipizzato e renderizza un componente client. Funzioni pure gestiscono ricerca, filtri, ordinamento e riepiloghi; immagini e font restano locali alla cartella dell'app. Il catalogo Supabase esistente gestisce pubblicazione e accesso anonimo.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS Modules, Vitest, Supabase esistente.

## Global Constraints

- Nessuna nuova libreria UI o modifica allo schema Supabase.
- Tutti i file dell'app vivono in `src/app/apps/archivio-pc/`.
- La UI rispetta `DESIGN_SYSTEM.md`, è responsive e accessibile da tastiera.
- Il record 16 esistente rappresenta già `NbCantiereTRUE`; aggiungere solo `NbUfficioT2` come record 33.
- L'interfaccia è sempre in sola lettura e stampa soltanto le schede selezionate.

---

### Task 1: Dataset e dominio testabile

**Files:**
- Create: `src/app/apps/archivio-pc/data/pcs.json`
- Create: `src/app/apps/archivio-pc/domain/archive.ts`
- Test: `src/app/apps/archivio-pc/domain/archive.test.ts`

**Interfaces:**
- Produces: `PcRecord`, `PcFilters`, `filterPcs(pcs, filters)`, `summarizePcs(pcs)`, `uniqueValues(pcs, key)`.

- [ ] Copiare i 32 record sorgente e aggiungere il record 33 Lenovo ThinkPad P16s Gen 3, senza duplicare il record 16.
- [ ] Scrivere test che verificano conteggio 33, deduplicazione, ricerca testuale, filtri area/tipologia, ordinamento e riepiloghi.
- [ ] Eseguire `npx vitest run src/app/apps/archivio-pc/domain/archive.test.ts` e verificare il fallimento per modulo mancante.
- [ ] Implementare le funzioni pure con normalizzazione case-insensitive e ordinamento stabile.
- [ ] Rieseguire il test mirato e ottenere tutti i test verdi.

### Task 2: Interfaccia nativa e asset

**Files:**
- Create: `src/app/apps/archivio-pc/page.tsx`
- Create: `src/app/apps/archivio-pc/archive-pc.tsx`
- Create: `src/app/apps/archivio-pc/archive-pc.module.css`
- Create: `src/app/apps/archivio-pc/assets/*`
- Create: `src/app/apps/archivio-pc/image-map.ts`

**Interfaces:**
- Consumes: `PcRecord[]`, `filterPcs`, `summarizePcs`, `uniqueValues`.
- Produces: pagina `/apps/archivio-pc`, dialogo dettagli e stampa delle selezioni.

- [ ] Copiare immagini, logo e font dal progetto `PC Aziendali` nella sola cartella dell'app.
- [ ] Implementare intestazione, KPI, ricerca, filtri, ordinamento, griglia e stato vuoto.
- [ ] Implementare selezione, pannello `dialog` accessibile, fallback immagine e foglio stampa dedicato.
- [ ] Aggiungere responsive desktop/mobile, focus-visible, riduzione movimento e regole `@media print`.
- [ ] Eseguire test dominio, `npm run typecheck` e `npm run build`.

### Task 3: Verifica visiva e pubblicazione

**Files:**
- Modify: nessun file fuori dalla cartella dell'app e dalla documentazione di piano.
- External state: riga `apps` Supabase con URL `/apps/archivio-pc`.

**Interfaces:**
- Produces: app online, pubblica e assegnabile.

- [ ] Avviare Next.js e verificare desktop e mobile: gerarchia, filtri, dialogo, tastiera, contrasto e overflow.
- [ ] Eseguire una verifica fresca di test mirati, typecheck e build.
- [ ] Committare soltanto piano e `src/app/apps/archivio-pc/`, quindi pubblicare su `main` senza includere modifiche estranee.
- [ ] Attendere il deploy Vercel e verificare `https://www.truedesign.app/apps/archivio-pc` senza login.
- [ ] Creare o aggiornare il record catalogo con `is_active = true`, `visibility = pubblica` e URL interno.
- [ ] Verificare la presenza in `/admin/apps` e `/admin/assignments` e l'accesso amministratore.
