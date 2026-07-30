# App Icon Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrare le cinque icone True nelle card verticali delle app e rinominare definitivamente “True Tetris Pallet” in “Tetris Pallet”.

**Architecture:** Un componente server-side `AppIcon` rende solo il tracciato SVG associato all’URL dell’app. Una funzione pura centralizza mappatura e nome visualizzato; homepage, dashboard e pagina pubblica riusano lo stesso pattern.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS globale, Vitest, Supabase migration.

## Global Constraints

- Riutilizzare Suisse Int’l, token e CSS esistenti.
- Nessuna nuova dipendenza.
- Card verticali `4 / 5`, titolo interno e icona monocromatica.
- Hover/focus con sfondo `#302515` e contenuti `var(--accent-soft)`.
- Mappatura basata sull’URL interno dell’app.

---

### Task 1: Mappatura e componente icona

**Files:**
- Create: `src/app/_components/app-icon.tsx`
- Create: `src/app/_components/app-icon.test.ts`

**Interfaces:**
- Produces: `getAppIconKey(url: string | null): AppIconKey | null`
- Produces: `getAppDisplayName(name: string, url: string | null): string`
- Produces: `AppIcon({ url, className? })`

- [ ] **Step 1: Write the failing test**

Verificare le cinque associazioni URL, il fallback `null` e la normalizzazione
di `/apps/true-tetris-pallet` in “Tetris Pallet”.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/_components/app-icon.test.ts`
Expected: FAIL perché `app-icon.tsx` non esiste.

- [ ] **Step 3: Write minimal implementation**

Creare la funzione di mappatura e rendere i cinque tracciati SVG originali con
`fill="currentColor"` e `aria-hidden="true"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/_components/app-icon.test.ts`
Expected: PASS.

### Task 2: Integrare icone e nomi nelle card

**Files:**
- Modify: `src/app/_components/home-app-link.tsx`
- Modify: `src/app/dashboard/app-link.tsx`
- Modify: `src/app/pubblico/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `AppIcon`, `getAppDisplayName`

- [ ] **Step 1: Render icon and normalized title**

Inserire icona e titolo in un wrapper comune `.app-card-content`.

- [ ] **Step 2: Apply vertical card CSS**

Impostare `aspect-ratio: 4 / 5`, layout verticale, icona responsiva e stati
hover/focus richiesti, inclusa la riduzione del movimento.

- [ ] **Step 3: Verify responsive layout**

Controllare desktop e mobile senza overflow.

### Task 3: Rinomina del prodotto e catalogo

**Files:**
- Modify: `src/app/apps/true-tetris-pallet/page.tsx`
- Modify: `src/app/apps/true-tetris-pallet/app-document.ts`
- Create: `supabase/migrations/20260730_rename_true_tetris_pallet.sql`

- [ ] **Step 1: Update visible titles**

Sostituire “True Tetris Pallet” con “Tetris Pallet” nei titoli visibili e nel
documento incorporato, senza cambiare slug o identificatori tecnici.

- [ ] **Step 2: Add catalog migration**

Aggiornare `public.apps.name` a `Tetris Pallet` dove
`url = '/apps/true-tetris-pallet'`.

### Task 4: Verifica e pubblicazione

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused and full checks**

Run: `npm test -- src/app/_components/app-icon.test.ts`
Run: `npm run typecheck`
Run: `npm run build`

- [ ] **Step 2: Inspect diff**

Run: `git diff --check`
Expected: nessun errore.

- [ ] **Step 3: Publish**

Run: `./scripts/pubblica.sh "feat: rinnova le card delle app con le icone True"`
Expected: commit e push su `main`, seguito da deploy Vercel riuscito.

