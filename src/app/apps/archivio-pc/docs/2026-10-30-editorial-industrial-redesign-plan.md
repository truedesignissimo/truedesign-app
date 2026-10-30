# Archivio PC Editorial Industrial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Stato: implementazione e verifica di produzione completate il 30 ottobre 2026; pubblicazione in corso.

**Goal:** Ridisegnare Archivio PC con palette grafite e blu tecnici, Suisse Int’l e loghi riconoscibili delle famiglie di processori, mantenendo invariati dati e funzioni.

**Architecture:** La classificazione dei processori viene estratta in un modulo puro e testabile; un componente `CpuBrand` traduce la classificazione in logo e variante cromatica. Il markup delle schede riusa questo componente, mentre il CSS Module assume la nuova direzione editoriale senza introdurre dipendenze.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, CSS Modules, Vitest, asset PNG locali estratti dalla versione originale fornita dall’utente.

## Global Constraints

- Base bianco ottico e grafite molto scura; nessuno sfondo panna.
- Gamma blu tecnica: cobalto Intel, blu acciaio Xeon, azzurro freddo Core Ultra.
- Suisse Int’l tramite i file locali già presenti.
- Quattro schede desktop, due tablet, una mobile.
- Nessuna nuova dipendenza UI, modifica dati, Supabase, scoring o permessi.
- I loghi non sostituiscono mai il nome completo del processore.

---

### Task 1: Classificazione e loghi CPU

**Files:**
- Create: `src/app/apps/archivio-pc/cpu-brand.tsx`
- Create: `src/app/apps/archivio-pc/cpu-brand.test.tsx`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-i3.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-i5.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-i7.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-i9.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-ultra.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/intel-xeon.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/amd-ryzen.png`
- Create: `src/app/apps/archivio-pc/assets/cpu/apple.png`
- Modify: `src/app/apps/archivio-pc/archive-pc.module.css`

**Interfaces:**
- Produces: `classifyCpu(processor: string): CpuBrandInfo` e `CpuBrand({ processor }: { processor: string })`.
- `CpuBrandInfo` contiene `kind`, `label`, `family` e `tone` per il markup e il CSS.

- [ ] **Step 1: Write the failing classification and rendering tests**

```tsx
it.each([
  ["Intel Core i5-1335U", "intel-i5", "Intel Core i5"],
  ["Intel Core Ultra 7 155H", "intel-ultra", "Intel Core Ultra"],
  ["Intel Xeon W-2102", "intel-xeon", "Intel Xeon"],
  ["AMD Ryzen 5 7530U", "amd-ryzen", "AMD Ryzen"],
  ["Apple M4 Max", "apple", "Apple M4"],
])("classifica %s come %s", (processor, kind, label) => {
  expect(classifyCpu(processor)).toMatchObject({ kind, label });
});

it("renderizza un logo accessibile mantenendo la famiglia leggibile", () => {
  const html = renderToStaticMarkup(<CpuBrand processor="Intel Core i7-13700H" />);
  expect(html).toContain('aria-label="Intel Core i7"');
  expect(html).toContain("Intel Core i7");
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/app/apps/archivio-pc/cpu-brand.test.tsx`

Expected: FAIL because `cpu-brand.tsx` does not exist.

- [ ] **Step 3: Extract the embedded processor logos from the supplied original ZIP**

Read `archivio-pc/public/index.html` inside `/Users/truedesign/Downloads/archivio-pc.zip`, decode the existing `.lg.i3`, `.lg.i5`, `.lg.i7`, `.lg.i9`, `.lg.ultra`, `.lg.xeon`, `.lg.ryzen` and `.lg.apple` data URIs, and save them under `assets/cpu/`. Do not fetch replacements from the network.

- [ ] **Step 4: Implement the classification and logo component**

```tsx
export type CpuBrandKind = "intel-i3" | "intel-i5" | "intel-i7" | "intel-i9" | "intel-ultra" | "intel-xeon" | "amd-ryzen" | "apple" | "generic";

export function classifyCpu(processor: string): CpuBrandInfo {
  if (/Core Ultra/i.test(processor)) return { kind: "intel-ultra", label: "Intel Core Ultra", family: "Ultra", tone: "ice" };
  if (/Xeon/i.test(processor)) return { kind: "intel-xeon", label: "Intel Xeon", family: "Xeon", tone: "steel" };
  if (/Ryzen/i.test(processor)) return { kind: "amd-ryzen", label: "AMD Ryzen", family: "Ryzen", tone: "navy" };
  if (/Apple\s+(M\d+)/i.test(processor)) return { kind: "apple", label: `Apple ${RegExp.$1}`, family: RegExp.$1, tone: "graphite" };
  const core = processor.match(/\b(i[3579])\b/i)?.[1].toLowerCase();
  if (core) return { kind: `intel-${core}` as CpuBrandKind, label: `Intel Core ${core}`, family: core, tone: "cobalt" };
  return { kind: "generic", label: "Processore", family: "CPU", tone: "graphite" };
}
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run: `npm test -- src/app/apps/archivio-pc/cpu-brand.test.tsx`

Expected: all CPU brand tests pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/app/apps/archivio-pc/cpu-brand.tsx src/app/apps/archivio-pc/cpu-brand.test.tsx src/app/apps/archivio-pc/assets/cpu src/app/apps/archivio-pc/archive-pc.module.css
git commit -m "feat: aggiunge loghi processori archivio pc"
```

### Task 2: Schede hardware e gerarchia editoriale

**Files:**
- Modify: `src/app/apps/archivio-pc/archive-pc.tsx`
- Modify: `src/app/apps/archivio-pc/archive-pc.test.tsx`
- Modify: `src/app/apps/archivio-pc/archive-pc.module.css`

**Interfaces:**
- Consumes: `CpuBrand` da Task 1.
- Produces: card con logo CPU, processore completo, RAM dominante, indice potenza e sezioni reparto numerate.

- [ ] **Step 1: Replace the old family-badge expectations with failing logo and department-index tests**

```tsx
it("mostra il logo CPU e conserva il nome completo del processore", () => {
  const html = renderToStaticMarkup(<ArchivioPc pcs={[gaia]} />);
  expect(html).toContain('aria-label="Intel Core i5"');
  expect(html).toContain(gaia.processore);
  expect(html).not.toContain('class="cpuFamily"');
});

it("numera i reparti in ordine editoriale", () => {
  const html = renderToStaticMarkup(<ArchivioPc pcs={[gaia, pcsData[0], pcsData[3]] as PcRecord[]} />);
  expect(html).toMatch(/01[\s\S]*Ufficio Tecnico[\s\S]*02[\s\S]*Marketing[\s\S]*03[\s\S]*Da assegnare/);
});
```

- [ ] **Step 2: Run the focused interface tests and verify RED**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx`

Expected: FAIL because the card still renders the text-only CPU family badge and departments are not numbered.

- [ ] **Step 3: Integrate `CpuBrand` and department numbering**

Replace `cpuFamily()` and its `<span>` with `<CpuBrand processor={pc.processore} />`. Add `String(groupIndex + 1).padStart(2, "0")` to each department heading. Keep the full processor string adjacent to the logo and keep RAM as text, not inside the logo.

- [ ] **Step 4: Restyle the application using the approved palette**

Set CSS tokens to `--graphite: #24282f`, `--graphite-soft: #343a43`, `--white: #ffffff`, `--fog: #eef1f4`, `--cobalt: #1768c4`, `--steel: #315a80`, `--ice: #b9ddf2`. Use square-edged editorial controls, a graphite stats band, numbered department headers, flat white cards with graphite borders and blue hover/focus states. Retain the existing grid breakpoints and 180×116 image containment.

- [ ] **Step 5: Run the focused interface tests and verify GREEN**

Run: `npm test -- src/app/apps/archivio-pc/archive-pc.test.tsx src/app/apps/archivio-pc/cpu-brand.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/app/apps/archivio-pc/archive-pc.tsx src/app/apps/archivio-pc/archive-pc.test.tsx src/app/apps/archivio-pc/archive-pc.module.css
git commit -m "style: ridisegna archivio pc in chiave editoriale"
```

### Task 3: Verifica, pubblicazione e controllo live

**Files:**
- Modify: `src/app/apps/archivio-pc/docs/2026-10-30-editorial-industrial-redesign-plan.md`

**Interfaces:**
- Consumes: implementazione completa delle Task 1 e 2.
- Produces: build verificata e deploy pubblico controllato.

- [ ] **Step 1: Run the complete automated verification**

Run: `npm test && npm run typecheck -- --incremental false && npm run build && git diff --check`

Expected: zero test failures, typecheck exit 0, build exit 0, diff check clean.

- [ ] **Step 2: Check requirements against the approved spec**

Confirm in the rendered app: Suisse Int’l, no cream background, graphite/blue palette, four columns desktop, two tablet, one mobile, CPU logos present, complete processor and RAM visible, confidence hidden from card, department numbering present.

- [ ] **Step 3: Publish only Archivio PC files**

Run:

```bash
./scripts/pubblica.sh "ridisegna archivio pc con loghi processori" -- src/app/apps/archivio-pc
```

Expected: selective commit/push to `main`; Vercel deploy starts.

- [ ] **Step 4: Verify the live deployment**

Open `https://www.truedesign.app/apps/archivio-pc` with a cache-busting query and verify desktop and mobile. Confirm `/pubblico`, `/admin/apps` and `/admin/assignments` still expose Archivio PC and the route remains public/read-only.

- [ ] **Step 5: Record completion in the plan**

Mark every completed checkbox and commit the documentation update together with the publication commit when applicable.
