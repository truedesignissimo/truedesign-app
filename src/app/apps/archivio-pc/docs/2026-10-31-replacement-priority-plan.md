# Replacement Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the initial filter panel with one toggle that displays the six computers least suited to their assigned usage profile.

**Architecture:** Add a pure ranking helper beside the performance engine so the business rule is independent from the React view. The page keeps its department grouping and card component, switching only the source list between all computers and the ranked six.

**Tech Stack:** Next.js 15, React, TypeScript, CSS Modules, Vitest, React server rendering.

## Global Constraints

- Rank computers by `assessPerformance(pc).score`, already weighted for `pc.profilo`.
- Exclude computers whose assigned-profile score is `null`.
- Return at most six computers, score ascending, then assignee alphabetically.
- Remove the initial search, filtering and sorting controls.
- Keep the complete archive grouped by department as the default view.
- Use one toggle labelled `Da sostituire prima`, changing to `Mostra tutti` while active.
- Do not add dependencies or modify files outside `src/app/apps/archivio-pc/`.

---

### Task 1: Replacement ranking rule

**Files:**
- Modify: `src/app/apps/archivio-pc/domain/performance.ts`
- Test: `src/app/apps/archivio-pc/domain/performance.test.ts`

**Interfaces:**
- Consumes: `PcRecord[]` and the existing `assessPerformance(pc)` function.
- Produces: `rankReplacementPriority(pcs: PcRecord[], limit?: number): PcRecord[]`.

- [ ] **Step 1: Write the failing ranking tests**

Add tests that provide computers with known scores and assert that the helper returns the six lowest assigned-profile scores, excludes a record with no calculable score, and breaks equal scores by `assegnatario` using Italian locale ordering.

- [ ] **Step 2: Verify the tests fail for the missing export**

Run: `npm test -- src/app/apps/archivio-pc/domain/performance.test.ts`

Expected: FAIL because `rankReplacementPriority` is not exported.

- [ ] **Step 3: Implement the minimal pure helper**

Implement the helper by mapping each record to its assessment score, filtering `score !== null`, sorting by score and assignee, slicing to `limit`, and returning the original records.

- [ ] **Step 4: Verify the focused domain tests pass**

Run: `npm test -- src/app/apps/archivio-pc/domain/performance.test.ts`

Expected: PASS.

### Task 2: Single priority control

**Files:**
- Modify: `src/app/apps/archivio-pc/archive-pc.tsx`
- Modify: `src/app/apps/archivio-pc/archive-pc.module.css`
- Test: `src/app/apps/archivio-pc/archive-pc.test.tsx`

**Interfaces:**
- Consumes: `rankReplacementPriority(pcs)` from Task 1.
- Produces: the default full archive and a stateful `Da sostituire prima` / `Mostra tutti` toggle.

- [ ] **Step 1: Write failing interface tests**

Assert that static markup contains `Da sostituire prima`, contains no search input or filter/sort selects, and that an exported presentational toggle renders `Mostra tutti` for the active state.

- [ ] **Step 2: Verify the interface tests fail**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx`

Expected: FAIL because the old controls remain and the new toggle is absent.

- [ ] **Step 3: Implement the toggle and list switching**

Remove filter state, unique-value calculations, search/filter markup and the empty-filter reset. Add `priorityOnly` state, memoize the ranked six, choose between those and all `pcs`, and keep grouping through `groupPcsByArea`. Render the single toggle in the result bar and style its active and inactive states with the existing dark-blue visual language.

- [ ] **Step 4: Verify focused UI tests pass**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx`

Expected: PASS.

### Task 3: Regression, build and publication

**Files:**
- Verify all files under `src/app/apps/archivio-pc/`.

**Interfaces:**
- Consumes: completed domain and UI behavior.
- Produces: a tested production build and deployed app.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run TypeScript and production build**

Run: `npx tsc --noEmit`

Run: `npm run build`

Expected: both commands exit 0.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only Archivio PC files changed.

- [ ] **Step 4: Publish selectively**

Run: `./scripts/pubblica.sh "semplifica priorita sostituzione archivio pc" -- src/app/apps/archivio-pc`

Expected: commit and push to `main` succeed.

- [ ] **Step 5: Verify the deployed page**

Open `https://www.truedesign.app/apps/archivio-pc`, confirm the old filters are absent, activate `Da sostituire prima`, confirm six cards are shown and the control changes to `Mostra tutti`.

