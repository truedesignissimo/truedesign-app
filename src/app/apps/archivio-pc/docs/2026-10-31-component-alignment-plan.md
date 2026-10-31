# Component Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align CPU, RAM and GPU descriptions in every card, reduce CPU logo size and mark explicitly unverified values with a small accessible warning icon.

**Architecture:** Keep the existing `HardwareSpecs` component and introduce a small pure uncertainty predicate plus a reusable inline warning marker. Normalize the three rows through CSS so they share one label column and one description column.

**Tech Stack:** Next.js 15, React, TypeScript, CSS Modules, Vitest, React server rendering.

## Global Constraints

- CPU logos are about 32 px and replace the generic CPU icon in the label column.
- CPU, RAM and GPU descriptions start on the same vertical axis.
- RAM capacity remains moderately emphasized but smaller than the current 21 px.
- Show the warning only when the displayed value explicitly contains `da verificare`.
- The warning exposes `Informazione da verificare` as tooltip and accessible text.
- Do not add dependencies or modify files outside `src/app/apps/archivio-pc/`.

---

### Task 1: Accessible uncertainty marker

**Files:**
- Modify: `src/app/apps/archivio-pc/archive-pc.tsx`
- Test: `src/app/apps/archivio-pc/archive-pc.test.tsx`

**Interfaces:**
- Produces: `isUnverified(value: string): boolean` and an inline warning marker used by hardware descriptions.

- [ ] Write failing tests proving that `da verificare` is detected case-insensitively, ordinary values are not, and GPU markup includes the accessible warning only for an uncertain value.
- [ ] Run `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx` and confirm the new tests fail for the missing behavior.
- [ ] Implement the predicate and warning marker, then use it beside the relevant quick-spec value.
- [ ] Run the focused test again and confirm it passes.

### Task 2: Shared component alignment

**Files:**
- Modify: `src/app/apps/archivio-pc/archive-pc.tsx`
- Modify: `src/app/apps/archivio-pc/archive-pc.module.css`
- Test: `src/app/apps/archivio-pc/archive-pc.test.tsx`

**Interfaces:**
- Consumes: the existing `CpuBrand`, `HardwareIcon` and `RamValue` components.
- Produces: identical two-column row structure for CPU, RAM and GPU.

- [ ] Add a failing markup test that expects the CPU brand in the term column and the full processor text in the description column, without a duplicated generic CPU icon.
- [ ] Run the focused test and confirm failure.
- [ ] Move `CpuBrand` into the CPU term, normalize row markup, reduce logo dimensions to 32 px, vertically center all rows and reduce RAM capacity to 18 px.
- [ ] Run the focused test and confirm all interface tests pass.

### Task 3: Regression and publication

**Files:**
- Verify all changes under `src/app/apps/archivio-pc/`.

- [ ] Run `npm test`, `npm run typecheck` and `npm run build`; all must exit 0.
- [ ] Run `git diff --check` and confirm only Archivio PC files changed.
- [ ] Publish selectively with `./scripts/pubblica.sh "allinea componenti e avvisi archivio pc" -- src/app/apps/archivio-pc`.
- [ ] Verify the deployed desktop and mobile card layout on `https://www.truedesign.app/apps/archivio-pc`.

