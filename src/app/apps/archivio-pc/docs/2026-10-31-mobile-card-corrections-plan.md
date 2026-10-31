# Correzioni Schede PC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridurre il peso visivo dei marchi CPU, rendere bianca l'area fotografica e mostrare nelle card soltanto la capacità RAM.

**Architecture:** La modifica resta confinata ai componenti e agli stili dell'Archivio PC. Un piccolo componente `RamValue` separa capacità e dettagli della memoria, così card e scheda dettagliata usano la stessa sorgente dati con gerarchie diverse.

**Tech Stack:** Next.js 15, React, TypeScript, CSS Modules, Vitest.

## Global Constraints

- Nessuna nuova dipendenza.
- Intel Core i5, i7 e i9 mostrano il solo marchio blu, senza fondo o cornice aggiuntivi.
- L'area fotografica della card è bianca.
- Nelle card compare soltanto la capacità RAM; il valore completo resta nel dettaglio.
- La griglia desktop resta a quattro colonne.

---

### Task 1: Gerarchia RAM e correzioni visive

**Files:**
- Modify: `src/app/apps/archivio-pc/archive-pc.tsx`
- Modify: `src/app/apps/archivio-pc/archive-pc.module.css`
- Modify: `src/app/apps/archivio-pc/archive-pc.test.tsx`

**Interfaces:**
- Produces: `splitRam(value: string): { capacity: string; details: string }`
- Produces: `RamValue({ value, compact }: { value: string; compact?: boolean })`

- [ ] **Step 1: Write the failing RAM hierarchy test**

Renderizzare `RamValue` in modalità compatta e dettagliata; verificare che `32 GB (2667 MT/s)` diventi `32 GB` nella card e mantenga `2667 MT/s` in un elemento secondario nel dettaglio.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx`

Expected: FAIL perché `RamValue` non esiste.

- [ ] **Step 3: Implement the minimal RAM component**

Separare la capacità iniziale espressa in GB dal resto del valore. Usare `compact` nella card e il rendering completo nella `detailList` per il campo `ram`.

- [ ] **Step 4: Apply the approved CSS corrections**

Impostare `.imageWrap` su fondo bianco; rimuovere fondo e padding dal tono Intel Core; colorare i PNG i5/i7/i9 in blu; ridurre il marchio a circa 40 px; stilizzare `.ramSpeed` in corpo ridotto.

- [ ] **Step 5: Run focused and complete verification**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx src/app/apps/archivio-pc/cpu-brand.test.tsx`

Then: `npm test && npm run typecheck -- --incremental false && npm run build && git diff --check`

Expected: tutti i test e la build passano.

- [ ] **Step 6: Verify live desktop and mobile**

Controllare superficie fotografica bianca, marchi CPU blu senza contenitore, RAM compatta e assenza di overflow alle larghezze desktop e mobile.
