# Archivio PC Department Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridisegnare l’archivio in sezioni per reparto con quattro card compatte per riga e aggiungere l’icona dell’app al catalogo.

**Architecture:** Il dominio espone un raggruppamento ordinato per area; il componente React renderizza una sezione per gruppo e una card hardware compatta; CSS Modules governa griglia e dimensioni immagini. L’icona usa il sistema SVG condiviso esistente.

**Tech Stack:** Next.js 15, React, TypeScript, CSS Modules, Vitest.

## Global Constraints

- Nessuna nuova dipendenza e nessuna modifica Supabase.
- Nessuna modifica ai dati o all’algoritmo dei punteggi.
- Quattro colonne desktop, due tablet, una mobile.
- Profilo, provvisorietà e attendibilità assenti dal corpo card e disponibili nel tooltip del badge Potenza.
- Modifiche fuori dall’app limitate ai componenti icona condivisi.

---

### Task 1: Raggruppamento per reparto

**Files:** Modify `domain/archive.ts`; Modify `domain/archive.test.ts`.

- [ ] Scrivere test fallenti per ordine gruppi, gruppo Da assegnare e omissione gruppi vuoti.
- [ ] Eseguire il test e osservare RED.
- [ ] Implementare `groupPcsByArea(pcs)` senza mutare l’array.
- [ ] Eseguire i test e ottenere GREEN.

### Task 2: Card hardware e layout responsive

**Files:** Modify `archive-pc.tsx`; Modify `archive-pc.module.css`; Modify `archive-pc.test.tsx`.

- [ ] Scrivere test SSR fallenti per titoli reparto, badge Potenza, CPU/RAM/GPU e tooltip.
- [ ] Eseguire il test e osservare RED.
- [ ] Renderizzare sezioni per reparto e card compatte con icone vettoriali hardware.
- [ ] Nascondere dal corpo card profilo, provvisorietà e attendibilità.
- [ ] Impostare immagini uniformi e griglia 4/2/1.
- [ ] Eseguire i test e ottenere GREEN.

### Task 3: Icona Archivio PC

**Files:** Modify `src/app/_components/app-icon-model.ts`; Modify `src/app/_components/app-icon.tsx`; Modify `src/app/_components/app-icon.test.ts`.

- [ ] Aggiungere prima il test fallente della mappatura `/apps/archivio-pc`.
- [ ] Osservare RED.
- [ ] Aggiungere chiave `computer`, viewBox e artwork monitor + torre.
- [ ] Eseguire il test e ottenere GREEN.

### Task 4: Verifica e pubblicazione

- [ ] Eseguire test completi, typecheck e build.
- [ ] Verificare desktop e mobile nel browser.
- [ ] Revisionare il diff e correggere problemi importanti.
- [ ] Pubblicare selettivamente app e componenti icona con `scripts/pubblica.sh`.
- [ ] Verificare URL pubblico, 35 PC, sezioni reparto, nuova icona e accesso pubblico.
