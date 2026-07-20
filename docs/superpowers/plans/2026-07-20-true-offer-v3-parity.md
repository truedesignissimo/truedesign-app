# TRUE Generatore Offerte V3 Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reduced React quote generator with a faithful React port of the official V3 interface and workflows while retaining True App authentication, Supabase persistence, and custom image upload.

**Architecture:** The official generated V3 HTML remains the visual and behavioral reference, but runtime code stays native React. A versioned offer schema and pure commercial functions feed focused form, line-table, archive, and PDF components; the existing Supabase repository and private image bucket remain the persistence adapters.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS Modules, Vitest, jsPDF, Supabase.

## Global Constraints

- Official PDFs are the absolute commercial source of truth for prices, variants, fabrics, finishes, colors, materials, and extra charges.
- Before reporting a missing price, re-open and visually verify the official PDF page.
- Visual and functional reference: `/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/index.html`.
- Work only inside `src/app/apps/true-generatore-offerte/`, except local font assets, documentation, and strictly necessary package metadata.
- Keep True App authentication and Supabase persistence.
- Keep custom image upload; do not expose Gemini/OpenAI image generation.
- Preserve the archived AI design in `src/app/apps/true-generatore-offerte/docs/future-image-generation.md`.
- Use Suisse Intl local fonts and reproduce the V3 desktop/mobile visual contract.
- Do not modify platform tables beyond the already-applied compatible migrations.

---

## File Structure

**Create**

- `src/app/apps/true-generatore-offerte/domain/discount.ts`: chained discount parsing and application.
- `src/app/apps/true-generatore-offerte/domain/discount.test.ts`: discount contract.
- `src/app/apps/true-generatore-offerte/domain/offer-normalization.ts`: migration of reduced saved payloads.
- `src/app/apps/true-generatore-offerte/domain/offer-normalization.test.ts`: compatibility contract.
- `src/app/apps/true-generatore-offerte/components/legacy-header.tsx`: TRUE header, price-list dots, language and dashboard link.
- `src/app/apps/true-generatore-offerte/components/customer-details.tsx`: complete customer and commercial form.
- `src/app/apps/true-generatore-offerte/components/commercial-options.tsx`: discounts, PDF switches, special options, notes.
- `src/app/apps/true-generatore-offerte/legacy-parity.test.ts`: structural parity test.
- `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Book.otf`: official local font copy.
- `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Medium.otf`: official local font copy.
- `src/app/apps/true-generatore-offerte/assets/SuisseIntl-SemiBold.otf`: official local font copy.
- `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Bold.otf`: official local font copy.

**Modify**

- `src/app/apps/true-generatore-offerte/domain/types.ts`: complete versioned offer schema.
- `src/app/apps/true-generatore-offerte/domain/pricing.ts`: chained discounts and VAT totals.
- `src/app/apps/true-generatore-offerte/domain/pricing.test.ts`: commercial totals.
- `src/app/apps/true-generatore-offerte/state/offer-reducer.ts`: full defaults and actions.
- `src/app/apps/true-generatore-offerte/state/offer-reducer.test.ts`: state behavior.
- `src/app/apps/true-generatore-offerte/data/offers-repository.ts`: normalize payloads on read.
- `src/app/apps/true-generatore-offerte/data/offers-repository.test.ts`: persistence compatibility.
- `src/app/apps/true-generatore-offerte/components/product-search.tsx`: original card/search markup.
- `src/app/apps/true-generatore-offerte/components/product-configurator.tsx`: complete row configuration.
- `src/app/apps/true-generatore-offerte/components/offer-lines.tsx`: original commercial table.
- `src/app/apps/true-generatore-offerte/components/offer-totals.tsx`: subtotal, discount, VAT, total.
- `src/app/apps/true-generatore-offerte/components/offer-archive.tsx`: bottom archive with open/delete/new.
- `src/app/apps/true-generatore-offerte/components/pdf-preview.tsx`: original action order and preview gate.
- `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.ts`: complete compact V3 PDF.
- `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.test.ts`: PDF layout helpers and content.
- `src/app/apps/true-generatore-offerte/offer-generator.tsx`: faithful composition and workflows.
- `src/app/apps/true-generatore-offerte/offer-generator.module.css`: V3 visual contract.

---

### Task 1: Versioned offer model and commercial math

**Files:**
- Create: `src/app/apps/true-generatore-offerte/domain/discount.ts`
- Create: `src/app/apps/true-generatore-offerte/domain/discount.test.ts`
- Create: `src/app/apps/true-generatore-offerte/domain/offer-normalization.ts`
- Create: `src/app/apps/true-generatore-offerte/domain/offer-normalization.test.ts`
- Modify: `src/app/apps/true-generatore-offerte/domain/types.ts`
- Modify: `src/app/apps/true-generatore-offerte/domain/pricing.ts`
- Modify: `src/app/apps/true-generatore-offerte/domain/pricing.test.ts`
- Modify: `src/app/apps/true-generatore-offerte/state/offer-reducer.ts`
- Modify: `src/app/apps/true-generatore-offerte/state/offer-reducer.test.ts`

**Interfaces:**
- Produces: `OfferLanguage`, `Offer.schemaVersion`, `Offer.offerDate`, `Offer.validityDays`, `Offer.vatRate`, `Offer.globalDiscount`, `Offer.showDiscounts`, `Offer.showNetPrices`, `Offer.paymentTerms`, `Offer.specialOptions`.
- Produces: `parseDiscountExpression(value: string): number[]` and `discountMultiplier(value: string): number`.
- Produces: `normalizeOffer(value: unknown, userId: string): Offer`.
- Produces: `OfferTotals` with `subtotal`, `discount`, `net`, `vat`, `total`.

- [ ] **Step 1: Write failing discount and normalization tests**

```ts
import { describe, expect, it } from "vitest";
import { discountMultiplier, parseDiscountExpression } from "./discount";

describe("chained discounts", () => {
  it("applies 50+5 sequentially", () => {
    expect(parseDiscountExpression("50+5")).toEqual([50, 5]);
    expect(discountMultiplier("50+5")).toBeCloseTo(0.475);
  });

  it("clamps invalid percentages and accepts comma decimals", () => {
    expect(parseDiscountExpression("10,5 + 200 + bad")).toEqual([10.5, 100]);
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { normalizeOffer } from "./offer-normalization";

describe("normalizeOffer", () => {
  it("migrates the reduced React payload without losing lines", () => {
    const offer = normalizeOffer({
      id: "o1", userId: "u1", number: "DRAFT-1", priceList: "ITAENG",
      customer: { name: "Giulia" }, project: {}, lines: [],
      globalDiscountPercent: 12,
    }, "u1");
    expect(offer.schemaVersion).toBe(3);
    expect(offer.globalDiscount).toBe("12");
    expect(offer.vatRate).toBe(22);
    expect(offer.customer.vatNumber).toBe("");
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/domain/discount.test.ts src/app/apps/true-generatore-offerte/domain/offer-normalization.test.ts
```

Expected: FAIL because both modules and the V3 fields do not exist.

- [ ] **Step 3: Implement the pure discount functions**

```ts
export function parseDiscountExpression(value: string): number[] {
  return String(value ?? "")
    .split("+")
    .map((part) => Number(part.trim().replace(",", ".")))
    .filter(Number.isFinite)
    .map((part) => Math.min(100, Math.max(0, part)));
}

export function discountMultiplier(value: string): number {
  return parseDiscountExpression(value)
    .reduce((factor, discount) => factor * (1 - discount / 100), 1);
}

export function discountLabel(value: string): string {
  return parseDiscountExpression(value).join("+") || "0";
}
```

- [ ] **Step 4: Expand the schema and normalization defaults**

Use these exact fields in `Offer`:

```ts
export type OfferLanguage = "it" | "en" | "fr" | "de" | "he" | "zh" | "ar";

export interface OfferSpecialOptions {
  class1IM: boolean;
  fireRetardant: boolean;
}

export interface OfferLine {
  id: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  pricesByList?: Partial<Record<PriceList, number>>;
  extras: number[];
  extrasByList?: Partial<Record<PriceList, number[]>>;
  discount: string;
  manualSurcharge: number;
  note: string;
  configuration: ProductConfiguration;
  customImagePath?: string;
}

export interface Offer {
  schemaVersion: 3;
  id: string;
  userId: string;
  number: string;
  offerDate: string;
  validityDays: number;
  validUntil: string;
  priceList: PriceList;
  language: OfferLanguage;
  currency: "EUR";
  customer: OfferParty & { vatNumber: string };
  project: OfferProject;
  salesRepresentative: string;
  paymentTerms: string;
  offerNotes: string;
  lines: OfferLine[];
  globalDiscount: string;
  vatRate: number;
  showDiscounts: boolean;
  showNetPrices: boolean;
  specialOptions: OfferSpecialOptions;
  createdAt: string;
  updatedAt: string;
}
```

`normalizeOffer` must preserve known fields, convert `globalDiscountPercent` to
`globalDiscount`, assign empty strings to missing text fields, assign `22` to
missing VAT, and normalize every line to `discount: String(line.discount ??
line.discountPercent ?? 0)`.

- [ ] **Step 5: Update totals and reducer defaults**

`calculateLineTotal` must apply `discountMultiplier(line.discount)` after unit
price plus extras. `calculateOfferTotals` must compute:

```ts
const subtotal = sum(lines);
const net = roundMoney(subtotal * discountMultiplier(offer.globalDiscount));
const discount = roundMoney(subtotal - net);
const vat = roundMoney(net * offer.vatRate / 100);
return { subtotal, discount, net, vat, total: roundMoney(net + vat) };
```

`createEmptyOffer` must populate all schema fields and generate dates from the
supplied timestamp without demo/customer seed data.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/domain src/app/apps/true-generatore-offerte/state
npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/apps/true-generatore-offerte/domain src/app/apps/true-generatore-offerte/state
git commit -m "feat: restore complete V3 offer model"
```

---

### Task 2: Structural parity shell and Suisse visual system

**Files:**
- Create: `src/app/apps/true-generatore-offerte/legacy-parity.test.ts`
- Create: `src/app/apps/true-generatore-offerte/components/legacy-header.tsx`
- Create: `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Book.otf`
- Create: `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Medium.otf`
- Create: `src/app/apps/true-generatore-offerte/assets/SuisseIntl-SemiBold.otf`
- Create: `src/app/apps/true-generatore-offerte/assets/SuisseIntl-Bold.otf`
- Modify: `src/app/apps/true-generatore-offerte/offer-generator.tsx`
- Modify: `src/app/apps/true-generatore-offerte/offer-generator.module.css`

**Interfaces:**
- Consumes: `Offer`, `OfferLanguage`, `PriceList`.
- Produces: `LegacyHeader` props `{ offer, status, onLanguage, onPriceList }`.
- Produces stable structural hooks: `data-v3-section="client|search|lines|archive"`.

- [ ] **Step 1: Write the failing structural parity test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./offer-generator.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./offer-generator.module.css", import.meta.url), "utf8");

describe("official V3 structural parity", () => {
  it.each(["client", "search", "lines", "archive"])("renders %s section", (name) => {
    expect(source).toContain(`data-v3-section=\"${name}\"`);
  });
  it("uses the official visual tokens and Suisse font", () => {
    expect(css).toContain("--tt-cream:#f5f2ec");
    expect(css).toContain("--tt-gold:#a98b56");
    expect(css).toContain("font-family:'Suisse Intl'");
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/legacy-parity.test.ts
```

Expected: FAIL because the reduced shell lacks V3 sections and tokens.

- [ ] **Step 3: Copy the four official fonts**

Copy from the canonical official directory:

```bash
cp '/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/fonts/SuisseIntl-Book.otf' src/app/apps/true-generatore-offerte/assets/
cp '/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/fonts/SuisseIntl-Medium.otf' src/app/apps/true-generatore-offerte/assets/
cp '/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/fonts/SuisseIntl-SemiBold.otf' src/app/apps/true-generatore-offerte/assets/
cp '/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/fonts/SuisseIntl-Bold.otf' src/app/apps/true-generatore-offerte/assets/
```

- [ ] **Step 4: Implement the original header contract**

`LegacyHeader` must render, in this order:

```tsx
<header className={styles.header}>
  <a className={styles.logoBlock} href="/dashboard" aria-label="Torna alla dashboard">
    <span className={styles.logoWord}>true</span>
    <span className={styles.subtitle}>Generatore Offerte Commerciali V3</span>
  </a>
  <div className={styles.headerControls}>
    <div className={styles.priceDots} aria-label="Selezione listino">
      <button type="button" aria-label="Listino ITA/ENG" className={offer.priceList === "ITAENG" ? styles.priceDotActive : styles.priceDot} onClick={() => onPriceList("ITAENG")} />
      <button type="button" aria-label="Listino ENG/FRA" className={offer.priceList === "ENGFRA" ? styles.priceDotActiveGrey : styles.priceDotGrey} onClick={() => onPriceList("ENGFRA")} />
    </div>
    <select aria-label="Lingua documento" value={offer.language} onChange={(event) => onLanguage(event.target.value as OfferLanguage)}>
      <option value="it">Italiano</option><option value="en">English</option>
      <option value="fr">Français</option><option value="de">Deutsch</option>
      <option value="he">עברית</option><option value="zh">中文</option><option value="ar">العربية</option>
    </select>
  </div>
</header>
```

The two price buttons must show black/grey dots, expose `ITA/ENG` and
`ENG/FRA` through accessible labels, and call `onPriceList`.

- [ ] **Step 5: Replace the reduced page shell**

`OfferGenerator` must compose exactly:

```tsx
<main className={styles.app}>
  <div className={styles.wrap}>
    <LegacyHeader offer={offer} status={status} onLanguage={(language) => change({ type: "language/set", language })} onPriceList={(priceList) => change({ type: "price-list/set", priceList })} />
    <div className={styles.notice}>V3 con configuratore prodotto. Per segnalazioni <a href="https://truedesignsrl-my.sharepoint.com/:x:/g/personal/gaia_bittante_truedesign_it/IQCFTupD66a7QKB1raJhPRngAflTtvxz8pXpzhLrTa37Nl0?e=NpZRIQ">compilare questo form</a>.</div>
    <section className={styles.card} data-v3-section="client"><CustomerDetails offer={offer} onChange={replace} /><CommercialOptions offer={offer} onChange={replace} /></section>
    <section className={styles.card} data-v3-section="search"><ProductSearch products={catalog.products} onSelect={addProduct} /></section>
    <section className={styles.card} data-v3-section="lines"><OfferLines lines={offer.lines} products={catalog.products} fabrics={catalog.fabrics.fabrics} priceList={offer.priceList} previews={previews} onUpdate={updateLine} onRemove={removeLine} onImage={uploadImage} /><OfferTotals offer={offer} /><PdfPreview offer={offer} products={catalog.products} imageUrls={previews} onReset={resetOffer} revision={offer.updatedAt} /></section>
    <section className={styles.card} data-v3-section="archive"><OfferArchive offers={archive} currentId={offer.id} onOpen={openOffer} onNew={resetOffer} onDelete={deleteOffer} /></section>
    <footer className={styles.footer}>TRUE DESIGN S.r.l. a socio unico — Via L. da Vinci 2, 35040 Sant'Elena (PD) — T +39 0429 692483</footer>
  </div>
</main>
```

- [ ] **Step 6: Port the official CSS tokens and responsive rules**

Use the official values exactly:

```css
@font-face{font-family:'Suisse Intl';src:url('./assets/SuisseIntl-Book.otf') format('opentype');font-weight:400}
@font-face{font-family:'Suisse Intl';src:url('./assets/SuisseIntl-Medium.otf') format('opentype');font-weight:500}
@font-face{font-family:'Suisse Intl';src:url('./assets/SuisseIntl-SemiBold.otf') format('opentype');font-weight:600}
@font-face{font-family:'Suisse Intl';src:url('./assets/SuisseIntl-Bold.otf') format('opentype');font-weight:700}
.app{--tt-black:#1a1a1a;--tt-cream:#f5f2ec;--tt-gold:#a98b56;--tt-grey:#6b6b6b;--tt-line:#e0ddd5;--tt-red:#b33a3a;min-height:100dvh;background:var(--tt-cream);color:var(--tt-black);padding:24px;font-family:'Suisse Intl',system-ui,sans-serif}
.wrap{max-width:1200px;margin:0 auto}
.card{background:#fff;border:1px solid var(--tt-line);padding:20px;margin-bottom:20px}
```

Port the remaining header, grid, form, table, totals, actions, archive and
mobile rules from the official `<style>` block without changing token values.

- [ ] **Step 7: Verify and commit**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/legacy-parity.test.ts
npm run typecheck
```

Expected: PASS.

```bash
git add src/app/apps/true-generatore-offerte
git commit -m "feat: restore official V3 visual shell"
```

---

### Task 3: Complete customer and commercial controls

**Files:**
- Create: `src/app/apps/true-generatore-offerte/components/customer-details.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/commercial-options.tsx`
- Modify: `src/app/apps/true-generatore-offerte/offer-generator.tsx`
- Modify: `src/app/apps/true-generatore-offerte/legacy-parity.test.ts`

**Interfaces:**
- `CustomerDetails({ offer, onChange })` updates immutable `Offer` fields.
- `CommercialOptions({ offer, onChange })` updates discounts, PDF flags, special options and notes.

- [ ] **Step 1: Extend the failing structural test**

Assert these labels occur in the component sources:

```ts
const requiredLabels = [
  "Nome", "Azienda", "Partita IVA / Codice fiscale", "Email", "Telefono",
  "Indirizzo", "Numero Offerta", "Data Preventivo", "Validità", "IVA",
  "Riferimento Progetto", "Referente Commerciale", "Tipologia di pagamento",
  "Sconto generale offerta (%)", "Mostra sconti nel PDF",
  "Mostra prezzi netti e totali riga", "Classe 1IM sulle righe dove richiesta",
  "Annota richiesta verniciatura ignifuga", "Note descrizione offerta",
];
requiredLabels.forEach((label) => expect(allComponentSource).toContain(label));
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/app/apps/true-generatore-offerte/legacy-parity.test.ts`  
Expected: FAIL on the first missing label.

- [ ] **Step 3: Implement `CustomerDetails`**

Render labelled controlled inputs for the exact ordered fields in Step 1.
Use `type="date"` for offer date and valid-until, `type="email"` for email,
and this exact VAT set:

```tsx
<select value={offer.vatRate} onChange={(event) => update({ vatRate: Number(event.target.value) })}>
  <option value={22}>22% (standard)</option>
  <option value={0}>0% (reverse charge / extra UE)</option>
  <option value={4}>4%</option>
  <option value={10}>10%</option>
</select>
```

Changing validity days must update `validUntil`; changing `validUntil` must
preserve the explicitly selected date.

- [ ] **Step 4: Implement `CommercialOptions`**

Render the discount string input, two PDF checkboxes, two special-option
checkboxes, and full-width notes textarea. Checkboxes must use native inputs
with explicit `<label htmlFor>` associations.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/legacy-parity.test.ts src/app/apps/true-generatore-offerte/state
npm run typecheck
```

Expected: PASS.

```bash
git add src/app/apps/true-generatore-offerte
git commit -m "feat: restore complete V3 commercial form"
```

---

### Task 4: Restore the commercial line table and configurator

**Files:**
- Modify: `src/app/apps/true-generatore-offerte/components/product-search.tsx`
- Modify: `src/app/apps/true-generatore-offerte/components/product-configurator.tsx`
- Modify: `src/app/apps/true-generatore-offerte/components/offer-lines.tsx`
- Modify: `src/app/apps/true-generatore-offerte/domain/product-pricing.ts`
- Modify: `src/app/apps/true-generatore-offerte/domain/product-pricing.test.ts`
- Modify: `src/app/apps/true-generatore-offerte/legacy-parity.test.ts`

**Interfaces:**
- `OfferLine.discount` is a chained-discount string.
- `OfferLine.manualSurcharge` is a numeric per-unit surcharge.
- `OfferLine.note` is free text.
- `OfferLine.configuration` continues to hold price choice, fabric, finish groups, extra selections, waive-extra state, 1IM and fire-retardant state.

- [ ] **Step 1: Add failing product-pricing tests**

```ts
it("waives an under-ten extra at the official threshold", () => {
  expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 9, false)).toBe(80);
  expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 10, false)).toBe(0);
  expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 2, true)).toBe(0);
});
```

Also assert switching between ITAENG and ENGFRA updates both base choice and
selected extra values without changing selection IDs.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/app/apps/true-generatore-offerte/domain/product-pricing.test.ts`  
Expected: FAIL because `extraAmount` and line parity fields are missing.

- [ ] **Step 3: Implement the original table columns**

`OfferLines` must render a `<table>` inside an overflow wrapper with this exact
header order:

```tsx
<tr>
  <th aria-label="Rimuovi" />
  <th>Codice</th><th>Immagine</th><th>Nome</th><th>Configurazione</th>
  <th>Qta</th><th>Categoria</th><th>Prezzo listino</th><th>Sconto %</th>
  <th>Sovrapprezzo</th><th>Totale Riga</th>
</tr>
```

The image cell must use `object-fit: contain`, show the product photo or
drawing, and expose only `Carica immagine`; no AI-generation button may render.

- [ ] **Step 4: Restore complete configuration controls**

For each catalog-supported field render:

- price choice/category with official price;
- component groups with finish names only;
- fabric manufacturer and fabric selectors while retaining the selected brand;
- official extra charges with displayed list price and free-quantity note;
- waive-extra checkbox;
- manual surcharge number input;
- per-line 1IM and fire-retardant checkboxes;
- line note.

Never synthesize an option absent from the catalog. Keep both lists in
`pricesByList`/`extrasByList` and recompute on list switch.

- [ ] **Step 5: Restore search presentation and focus flow**

Search results must show a 40×40 proportional image, code, family and localized
name. Selecting a product clears search, adds the row, expands its configurator
and scrolls/focuses the new row.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/domain/product-pricing.test.ts src/app/apps/true-generatore-offerte/domain/search.test.ts src/app/apps/true-generatore-offerte/legacy-parity.test.ts
npm run typecheck
```

Expected: PASS.

```bash
git add src/app/apps/true-generatore-offerte
git commit -m "feat: restore V3 product table and configurator"
```

---

### Task 5: Restore totals, archive, autosave and compatibility

**Files:**
- Modify: `src/app/apps/true-generatore-offerte/components/offer-totals.tsx`
- Modify: `src/app/apps/true-generatore-offerte/components/offer-archive.tsx`
- Modify: `src/app/apps/true-generatore-offerte/data/offers-repository.ts`
- Modify: `src/app/apps/true-generatore-offerte/data/offers-repository.test.ts`
- Modify: `src/app/apps/true-generatore-offerte/offer-generator.tsx`

**Interfaces:**
- Repository read methods always return `normalizeOffer(payload, userId)`.
- `OfferArchive` adds `onDelete(id)` and renders as the official bottom card.
- Save status values: `Caricamento catalogo...`, `Pronto`, `Salvataggio...`, `Salvata`, or an explicit error.

- [ ] **Step 1: Write failing repository compatibility test**

Make the Supabase mock return a reduced payload and assert `listOffers("u1")`
returns `schemaVersion: 3`, `vatRate: 22`, and `globalDiscount: "0"`.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/app/apps/true-generatore-offerte/data/offers-repository.test.ts`  
Expected: FAIL because repository returns raw payloads.

- [ ] **Step 3: Normalize reads and preserve full writes**

Apply `normalizeOffer` in `listOffers` and `loadOffer`. Keep the complete V3
payload in the existing `payload` JSONB column; no new Supabase table or column
is required.

- [ ] **Step 4: Implement official archive behavior**

Render columns for offer number, customer, project, updated date and actions.
Provide `Apri` and `Elimina`; deletion must call repository delete, remove the
item locally, and create a new empty offer if the current offer was deleted.

- [ ] **Step 5: Make autosave loss-safe**

Keep the 900 ms debounce. On failure keep `dirty=true`, preserve local state,
show the error, and allow the next change to retry. Loading an archive offer
must resolve signed custom-image previews before reporting `Pronto`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/data src/app/apps/true-generatore-offerte/state
npm run typecheck
```

Expected: PASS.

```bash
git add src/app/apps/true-generatore-offerte
git commit -m "feat: restore V3 archive and resilient autosave"
```

---

### Task 6: Restore the official PDF contract

**Files:**
- Modify: `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.ts`
- Modify: `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.test.ts`
- Modify: `src/app/apps/true-generatore-offerte/components/pdf-preview.tsx`
- Modify: `src/app/apps/true-generatore-offerte/components/pdf-preview.module.css`

**Interfaces:**
- `buildOfferPdf(offer, products, imageUrls)` remains the single PDF builder.
- `fitImage` remains proportional.
- Preview generation invalidates the previous URL after every offer change.

- [ ] **Step 1: Add failing PDF tests**

Test `fitImage(1200, 600, 40, 40)` returns `40×20`. Add pure helper tests for
localized metadata and configuration lines, asserting VAT, payment, notes,
discount visibility, custom image preference and no phrases such as
`Rivestimento sconsigliato dal listino ufficiale` unless explicitly selected.

- [ ] **Step 2: Run PDF tests and verify RED**

Run: `npx vitest run src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.test.ts`  
Expected: FAIL on missing metadata/configuration helpers.

- [ ] **Step 3: Port the compact V3 PDF layout**

Use A4, 16 mm margins, a smaller TRUE logo than the rejected preview, wrapped
right-side metadata capped inside 69 mm, and product rows with proportional
images. Include customer block, project/reference, payment and notes, list
price, optional discount/net columns, subtotal, global discount, VAT and total.
Use page-break checks before every row and totals block.

- [ ] **Step 4: Restore the preview/download gate**

Render actions in this order: `Anteprima offerta`, `Scarica PDF`, `Reset`.
`Scarica PDF` must be disabled until the current offer revision has generated a
successful preview. Any offer edit invalidates the prior preview.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx vitest run src/app/apps/true-generatore-offerte/pdf src/app/apps/true-generatore-offerte/domain/pricing.test.ts
npm run typecheck
```

Expected: PASS.

```bash
git add src/app/apps/true-generatore-offerte
git commit -m "feat: restore complete V3 PDF workflow"
```

---

### Task 7: Full verification, visual parity and publication

**Files:**
- Modify after concrete visual defects: `src/app/apps/true-generatore-offerte/offer-generator.module.css`.
- Modify after concrete workflow defects: `src/app/apps/true-generatore-offerte/offer-generator.tsx`.
- Modify after concrete PDF defects: `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.ts`.
- Update: `docs/superpowers/plans/2026-07-20-true-offer-v3-parity.md` checkboxes.
- Regenerate: `/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/deploy/truedesign-app-true-generatore-offerte-v3.zip`.

**Interfaces:**
- Original reference runs from the canonical `dist` directory.
- New implementation runs from the Next.js repository.

- [ ] **Step 1: Run the complete automated gate**

```bash
npm audit
npm test
npm run typecheck
npm run build
```

Expected: 0 vulnerabilities, 0 failed tests, typecheck exit 0, build exit 0.

- [ ] **Step 2: Run both applications locally**

```bash
php -S 127.0.0.1:8790
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Run the first command from the canonical `dist` directory and the second from
the Next.js repository.

- [ ] **Step 3: Compare desktop and mobile**

At 1440×1000 and 390×844 verify the same section order, header proportions,
Suisse typography, palette, form density, table behavior, totals, actions,
archive and footer. Add one product with fabric, finish, official extra and
custom image; verify no image distortion.

- [ ] **Step 4: Verify persistence and PDF**

Create a complete offer, wait for `Salvata`, reload it from archive, verify all
fields and custom image, open preview, inspect every PDF page, then download.

- [ ] **Step 5: Commit parity corrections**

```bash
git add src/app/apps/true-generatore-offerte docs/superpowers/plans/2026-07-20-true-offer-v3-parity.md
git commit -m "fix: complete V3 visual and functional parity"
```

- [ ] **Step 6: Publish**

```bash
./scripts/pubblica.sh "ripristina parità completa Generatore Offerte V3"
```

Expected: push to `main`; Vercel status `success`.

- [ ] **Step 7: Verify production and regenerate the archive**

Verify `https://www.truedesign.app/apps/true-generatore-offerte` redirects an
anonymous request to `/login` and renders the faithful app after authentication.
Create the ZIP from the published commit with `git archive`, run `unzip -t`,
calculate SHA-256, and copy it to the canonical Documents deploy directory.
