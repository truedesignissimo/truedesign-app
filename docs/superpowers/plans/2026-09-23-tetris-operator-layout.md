# Tetris Operator Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a denser order setup, a grounded container viewer, direct pallet-to-pallet movement, and cleaned document controls.

**Architecture:** Keep the standalone Tetris source authoritative. Update semantic HTML and CSS for layout, add a canvas renderer for container placement, and use the existing selection state for inline transfer targets. Generate the Next embedded document only after standalone tests pass.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node assertion tests, Next.js generated route.

## Global Constraints

- Keep planning and collision data structures unchanged.
- The printed brand must say True Design but never Tetris Pallet.
- Do not push a local `main`; publish the verified feature HEAD only after `origin/main` ancestry check.

---

### Task 1: Compact order and pallet selection controls

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/index.html`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

- [ ] Add assertions for a shared pallet-settings row, full-width supplementary description, and compact product grid.
- [ ] Run `node tests/pdf-label.test.js` and confirm it fails on the new assertions.
- [ ] Add `pallet-settings-row`, put height and overhang inside it, move the calculate button into the selection heading, and keep the custom-pallet fields in one desktop row.
- [ ] Reduce product-card spacing and make desktop cards four columns without reducing the supplementary-description width.
- [ ] Run `node tests/pdf-label.test.js` and confirm it passes.

### Task 2: Grounded container view and management layout

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/app.js`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

- [ ] Add a failing source assertion for the canvas container visual and its one-row controls.
- [ ] Run `node tests/pdf-label.test.js` and confirm it fails.
- [ ] Replace the container SVG assembly with an isometric canvas renderer sharing the pallet projection conventions and using floor-level pallet positions.
- [ ] Render three container choices in one row, put “Prova un’altra disposizione” beneath them, and divide management tools into compact groups.
- [ ] Run `node tests/pdf-label.test.js` and confirm it passes.

### Task 3: Inline overview transfer and document cleanup

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/index.html`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/app.js`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

- [ ] Add a failing assertion for inline move destinations and no Tetris Pallet string in printable brand markup.
- [ ] Run `node tests/pdf-label.test.js` and confirm it fails.
- [ ] Replace the overview modal trigger with an inline move button and destination choices; retain existing move validation and notices.
- [ ] Remove the geometry/control card, move document actions to the end of the editor, and change printed header copy to True Design plus document type.
- [ ] Run `node tests/pdf-label.test.js` and confirm it passes.

### Task 4: Build, embed, publish, and inspect

**Files:**
- Generate: `/Users/truedesign/Documents/Codex/True Tetris Pallet/outputs/truedesign-app/src/app/apps/true-tetris-pallet/app-document.ts`
- Modify: `/Users/truedesign/Documents/Codex/truedesign-app-git/.worktrees/true-tetris-feedback/src/app/apps/true-tetris-pallet/app-document.ts`

- [ ] Run every standalone test.
- [ ] Run `node scripts/build-next-route.mjs` and copy the generated document into the feature worktree.
- [ ] Run `npm run typecheck && npm run build` in the Next worktree.
- [ ] Commit the exact tested files, verify `origin/main` is an ancestor, push `HEAD:main`, and wait for Vercel Ready.
- [ ] Inspect the public app and report only verified outcomes.
