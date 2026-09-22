# True Tetris Pallet Compact Order and Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact the order-review and final shipment UI, then produce clear product-location customer PDFs and high-impact landscape pallet labels.

**Architecture:** The standalone document remains the source of truth. Update `app.js`, `styles.css` and Node assert tests, regenerate `app-document.ts`, then copy only that generated file into the Next.js route. The packer, persisted shipment shape and Supabase bridge stay unchanged.

**Tech Stack:** Vanilla JavaScript, CSS, Node assert tests, generated TypeScript document embedded in Next.js 15.

## Global Constraints

- Keep calculations, archive open/save/duplicate/delete and Supabase schema unchanged.
- Preserve Italian, English, French and German labels; product names are never translated.
- Add no dependency.
- Keep narrow screens usable; labels alone use landscape A4.

---

### Task 1: Compact product review cards

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css:698-1052`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

**Produces:** Compact cards; `.supplementary-description-field` spans both columns and its placeholder is muted normal text.

- [x] Write a failing source test:

```js
assert.match(css, /\.supplementary-description-field\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1;/);
assert.match(css, /\.supplementary-description-field \.cell-input::placeholder\s*\{[\s\S]*color:/);
```

- [x] Run `node tests/pdf-label.test.js`; failure confirmed because the two selectors did not exist.
- [x] Reduce card/title/code/packaging spacing and add:

```css
.product-card { min-height: 0; padding: 14px; }
.product-card-fields { gap: 8px; margin-top: 14px; }
.supplementary-description-field { grid-column: 1 / -1; }
.supplementary-description-field .cell-input::placeholder { color: #9a9aa1; font-weight: 400; opacity: 1; }
```

- [x] Re-run `node tests/pdf-label.test.js`; passed.

### Task 2: Order final-screen actions

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/index.html:131-152`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css:922-954`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

**Consumes:** Existing IDs `undo-edit`, `recalculate`, `save-shipment`, `print-cargo`, `print-client`, `print-labels`.

**Produces:** Two groups — `editor-action-group-order` and `editor-action-group-documents` — and a compact wrapping pallet-management row without changing event IDs.

- [x] Write a failing source test:

```js
assert.match(html, /class="editor-action-group editor-action-group-documents"/);
assert.match(css, /\.editor-actions\s*\{[\s\S]*justify-content:\s*flex-end/);
```

- [x] Run `node tests/pdf-label.test.js`; failure confirmed because the new group was absent.
- [x] Wrap existing buttons in the two groups, retain every id, and use flex rules with wrapping only below 900px.
- [x] Re-run `node tests/pdf-label.test.js`; passed.

### Task 3: Detail product locations in the customer PDF

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/app.js:2122-2135`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

**Consumes:** `state.optimization.pallets`, each box’s article code/label, and `operatorReference(palletIndex, box)`.

**Produces:** Customer rows with `{ code, label, packages, locations: Map<palletNumber, string[]> }`.

- [x] Write a failing source test:

```js
assert.match(app, /locations:\s*new Map\(\)/);
assert.match(app, /operatorReference\(palletIndex, box\)/);
assert.match(app, /references\.join\(", "\)/);
```

- [x] Run `node tests/pdf-label.test.js`; failure confirmed because client output had only pallet numbers.
- [x] Group every box reference per product and per pallet, then render `Pallet 1 · P1-01, P1-02; Pallet 2 · P2-03` with translated pallet text.
- [x] Re-run `node tests/pdf-label.test.js`; passed.

### Task 4: Redesign pallet labels

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/app.js:2113-2119`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css:2392-2397,2820-2955`
- Test: `/Users/truedesign/Documents/Codex/True Tetris Pallet/tests/pdf-label.test.js`

**Produces:** `.print-label-kicker`, `.print-label-number`, `.print-label-facts`, logo, order reference and facts on one landscape A4 page per pallet.

- [x] Write a failing source test:

```js
assert.match(app, /class="print-label-kicker"/);
assert.match(app, /class="print-label-number"/);
assert.match(css, /@page\s+pallet-label\s*\{\s*size:\s*A4 landscape;/);
```

- [x] Run `node tests/pdf-label.test.js`; failure confirmed because label output was portrait and lacked the hierarchy.
- [x] Render “Pallet” small, `N / Total` large, then order/pallet/dimensions/box count as facts. Use `.print-label-page { page: pallet-label; }` and `@page pallet-label { size: A4 landscape; }`; retain portrait for other documents.
- [x] Re-run `node tests/pdf-label.test.js`; passed.

### Task 5: Generate, verify and publish

**Files:**
- Generate: `/Users/truedesign/Documents/Codex/True Tetris Pallet/outputs/truedesign-app/src/app/apps/true-tetris-pallet/app-document.ts`
- Modify: `/Users/truedesign/Documents/Codex/truedesign-app-git/.worktrees/true-tetris-feedback/src/app/apps/true-tetris-pallet/app-document.ts`

- [x] Run `node scripts/build-next-route.mjs`.
- [x] Copy only the generated `app-document.ts` into the Next.js app directory.
- [x] Run:

```bash
node tests/engine.test.js && node tests/archive-autosave.test.js && node tests/archive-bridge.test.js && node tests/archive-grouping.test.js && node tests/archive-interaction.test.js && node tests/motion-layer.test.js && node tests/pdf-label.test.js && node tests/feedback-menu.test.js
```

- [x] Run `npm run typecheck && npm run build` in the Next.js worktree.
- [ ] Inspect desktop/narrow cards and customer/label previews; local browser preview is unavailable in this environment, so this remains a production verification item.
- [ ] Commit only the generated app document and this plan, then publish.
- [ ] Confirm Vercel is Ready and open `https://www.truedesign.app/apps/true-tetris-pallet` with a cache-busting query before reporting publication.
