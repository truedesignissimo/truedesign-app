# True Tetris Pallet Cloud Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Salvare e riaprire in Supabase tutti i piani True Tetris Pallet generati, con XLS/CSV originale opzionale e archivio condiviso agli utenti autorizzati all’app.

**Architecture:** Il configuratore resta nell’iframe `srcDoc`. Una pagina host React autenticata implementa un bridge `postMessage` e una repository Supabase; l’iframe chiede list/save/open/delete/download senza ricevere credenziali. La tabella contiene il piano serializzato e il bucket conserva l’eventuale file sorgente.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase JS/SSR, Vitest, HTML/CSS/JS standalone incorporato nell’iframe.

## Global Constraints

- Il piano, non l’XLS, è il dato principale e deve restare riapribile senza allegato.
- Tutti gli utenti con assegnazione `true-tetris-pallet` possono leggere, salvare, modificare ed eliminare ogni piano.
- Eliminare deve rimuovere sia record sia allegato, dopo conferma esplicita nell’interfaccia.
- XLS e CSV sono gli unici allegati accettati; limite 20 MB.
- Non riscrivere il motore di palletizzazione in React.

---

### Task 1: Definire dati, repository e test di serializzazione

**Files:**
- Create: `src/app/apps/true-tetris-pallet/data/types.ts`
- Create: `src/app/apps/true-tetris-pallet/data/shipments-repository.ts`
- Create: `src/app/apps/true-tetris-pallet/data/shipments-repository.test.ts`

**Interfaces:**
- Consumes: `SupabaseClient` da `@supabase/supabase-js`.
- Produces: `createTetrisShipmentsRepository(supabase)` con `list()`, `save(input)`, `load(id)`, `delete(id)`, `uploadSourceFile(id, file)`, `getSourceDownloadUrl(path)`.

- [ ] **Step 1: Write the failing repository tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { createTetrisShipmentsRepository } from "./shipments-repository";

it("saves the full pallet plan independently from the source file", async () => {
  const upsert = vi.fn().mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: "s-1", payload: { pallets: [] } }, error: null }) }) });
  const repository = createTetrisShipmentsRepository({ from: vi.fn(() => ({ upsert })) } as never);
  await expect(repository.save({ id: "s-1", title: "Ordine 1419", metadata: {}, settings: {}, plan: { pallets: [] }, summary: {} }))
    .resolves.toMatchObject({ id: "s-1" });
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "s-1", source_file_path: null }));
});

it("rejects a source file that is not XLSX or CSV", async () => {
  const repository = createTetrisShipmentsRepository({ storage: { from: vi.fn() } } as never);
  await expect(repository.uploadSourceFile("s-1", new File(["x"], "note.pdf", { type: "application/pdf" })))
    .rejects.toThrow("Sono supportati soltanto file XLSX o CSV");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/apps/true-tetris-pallet/data/shipments-repository.test.ts`

Expected: FAIL because `shipments-repository` does not exist.

- [ ] **Step 3: Implement the minimal typed repository**

```ts
export const TETRIS_BUCKET = "true-tetris-pallet-orders";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export function createTetrisShipmentsRepository(supabase: SupabaseClient) {
  return {
    async save(input: TetrisShipmentInput) {
      const result = await supabase.from("tetris_pallet_shipments").upsert({
        id: input.id,
        title: input.title,
        order_number: input.metadata.orderNumber ?? null,
        order_series: input.metadata.orderSeries ?? null,
        customer: input.metadata.customer ?? null,
        order_date: input.metadata.orderDate ?? null,
        destination: input.metadata.destination ?? null,
        source_file_name: input.sourceFile?.name ?? null,
        source_file_path: input.sourceFile?.path ?? null,
        payload: input,
        updated_at: new Date().toISOString(),
      }).select("id, payload").single();
      if (result.error) throw new Error(`Salvataggio piano: ${result.error.message}`);
      return result.data.payload as TetrisShipment;
    },
  };
}
```

- [ ] **Step 4: Run the focused test and the full test suite**

Run: `npm test -- src/app/apps/true-tetris-pallet/data/shipments-repository.test.ts && npm test`

Expected: PASS with no test failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/apps/true-tetris-pallet/data
git commit -m "Aggiunge repository piani Tetris"
```

### Task 2: Aggiungere la migrazione Supabase e le policy condivise

**Files:**
- Create: `supabase/migrations/20260721130000_create_tetris_pallet_shipments.sql`

**Interfaces:**
- Consumes: `profiles`, `apps`, `user_apps` esistenti e `auth.uid()`.
- Produces: tabella `public.tetris_pallet_shipments`, bucket `true-tetris-pallet-orders`, policy RLS `tetris_pallet_allowed()`.

- [ ] **Step 1: Write a migration assertion document beside the SQL**

```sql
-- Invariant: a user not assigned to /apps/true-tetris-pallet receives no rows.
-- Invariant: a permitted user can select every shipment, not only own shipments.
-- Invariant: storage object access requires the same assignment.
```

- [ ] **Step 2: Verify the migration is absent before adding it**

Run: `test ! -f supabase/migrations/20260721130000_create_tetris_pallet_shipments.sql`

Expected: exit code 0.

- [ ] **Step 3: Add the idempotent SQL migration**

```sql
create table public.tetris_pallet_shipments (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  order_number text,
  order_series text,
  customer text,
  order_date text,
  destination text,
  source_file_name text,
  source_file_path text,
  payload jsonb not null
);
alter table public.tetris_pallet_shipments enable row level security;
```

Add `tetris_pallet_allowed()` using `profiles.is_admin` or an active `apps.url = '/apps/true-tetris-pallet'` assignment, then create matching select/insert/update/delete policies. Insert one private bucket row only when absent and add matching storage policies.

- [ ] **Step 4: Validate SQL syntax with the project Supabase workflow**

Run: `supabase db lint`

Expected: PASS. If the CLI is not configured locally, execute this migration in Supabase SQL Editor and verify the tables, bucket and policies appear.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260721130000_create_tetris_pallet_shipments.sql
git commit -m "Aggiunge archivio cloud piani Tetris"
```

### Task 3: Implementare il bridge sicuro fra pagina host e iframe

**Files:**
- Create: `src/app/apps/true-tetris-pallet/tetris-archive-bridge.ts`
- Create: `src/app/apps/true-tetris-pallet/tetris-archive-bridge.test.ts`
- Modify: `src/app/apps/true-tetris-pallet/page.tsx`

**Interfaces:**
- Consumes: `createClient()` da `@/lib/supabase-browser` e repository del Task 1.
- Produces: `createArchiveMessageHandler({ repository, send })`, che accetta solo messaggi con `channel: 'true-tetris-archive'` e restituisce `{ requestId, ok, data | error }`.

- [ ] **Step 1: Write failing bridge tests**

```ts
it("ignores messages outside the True Tetris archive channel", async () => {
  const send = vi.fn();
  const handler = createArchiveMessageHandler({ repository: {} as never, send });
  await handler({ data: { channel: "other", action: "list" } } as MessageEvent);
  expect(send).not.toHaveBeenCalled();
});

it("returns a correlated list response", async () => {
  const send = vi.fn();
  const handler = createArchiveMessageHandler({ repository: { list: vi.fn().mockResolvedValue([{ id: "s-1" }]) } as never, send });
  await handler({ data: { channel: "true-tetris-archive", requestId: "r-1", action: "list" } } as MessageEvent);
  expect(send).toHaveBeenCalledWith({ channel: "true-tetris-archive", requestId: "r-1", ok: true, data: [{ id: "s-1" }] });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/apps/true-tetris-pallet/tetris-archive-bridge.test.ts`

Expected: FAIL because the bridge module is absent.

- [ ] **Step 3: Implement the bridge and mount it in the route page**

```tsx
const supabase = useMemo(() => createClient(), []);
const repository = useMemo(() => createTetrisShipmentsRepository(supabase), [supabase]);

useEffect(() => {
  const listener = (event: MessageEvent) => handler(event);
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}, [handler]);
```

The page must reply only to `iframeRef.current?.contentWindow`, never broadcast archive payloads to arbitrary windows.

- [ ] **Step 4: Run bridge and app checks**

Run: `npm test -- src/app/apps/true-tetris-pallet/tetris-archive-bridge.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/apps/true-tetris-pallet/page.tsx src/app/apps/true-tetris-pallet/tetris-archive-bridge.ts src/app/apps/true-tetris-pallet/tetris-archive-bridge.test.ts
git commit -m "Collega archivio Tetris a Supabase"
```

### Task 4: Collegare il configuratore all’archivio cloud

**Files:**
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/app.js`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/index.html`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/styles.css`
- Modify: `/Users/truedesign/Documents/Codex/True Tetris Pallet/scripts/build-next-route.mjs`
- Modify: `src/app/apps/true-tetris-pallet/app-document.ts` (generated by build script; do not edit manually)

**Interfaces:**
- Consumes: parent bridge actions `list`, `save`, `load`, `delete`, `uploadSource`, `downloadSource`.
- Produces: `window.TrueTetrisArchive.request(action, payload)` and a cloud-backed archive modal.

- [ ] **Step 1: Write a failing standalone browser test for archive message serialization**

```js
test("archive save serializes the current plan without requiring a source file", () => {
  const payload = window.TrueTetrisArchive.serializeShipment({ orderRows: [], optimization: { pallets: [] } });
  assert.equal(payload.sourceFile, null);
  assert.deepEqual(payload.plan, { pallets: [] });
});
```

- [ ] **Step 2: Run it before implementation**

Run: `node tests/archive-bridge.test.js`

Expected: FAIL because `TrueTetrisArchive` does not exist.

- [ ] **Step 3: Add minimal cloud archive behavior**

```js
function requestArchive(action, payload = {}) {
  const requestId = crypto.randomUUID();
  window.parent.postMessage({ channel: "true-tetris-archive", requestId, action, payload }, window.location.origin);
  return new Promise((resolve, reject) => pendingArchiveRequests.set(requestId, { resolve, reject }));
}
```

Replace the localStorage-backed shipment list with cloud `list`, `save`, `load` and `delete`; retain localStorage only as an offline fallback. Add search, attachment download and destructive confirmation. The first successful `calculatePallets()` creates/updates the cloud record; editing positions updates the same record after a short debounce.

- [ ] **Step 4: Regenerate the embedded route and run standalone tests**

Run: `node tests/archive-bridge.test.js && node tests/engine.test.js && node tests/xlsx-reader.test.js && node scripts/build-next-route.mjs`

Expected: PASS and regenerated `app-document.ts` only contains embedded runtime assets.

- [ ] **Step 5: Commit**

```bash
git add src/app/apps/true-tetris-pallet/app-document.ts
git commit -m "Aggiunge archivio piani condiviso"
```

### Task 5: Collaudo e pubblicazione

**Files:**
- Modify: `docs/superpowers/specs/2026-07-21-true-tetris-cloud-archive-design.md` only if test evidence uncovers a design correction.

**Interfaces:**
- Consumes: migrazione applicata, route deployata, utente con app assegnata.
- Produces: archivio cloud funzionante e URL pubblico verificato.

- [ ] **Step 1: Execute the migration in True App Supabase**

Run: execute `supabase/migrations/20260721130000_create_tetris_pallet_shipments.sql` in the project SQL Editor.

Expected: tabella e bucket presenti; RLS attivo.

- [ ] **Step 2: Perform the end-to-end browser test**

1. Importa `PL 1139 SIA FIRST.xlsx`.
2. Crea i pallet e modifica una posizione.
3. Verifica che l’archivio mostri il piano e l’allegato XLS.
4. Ricarica il piano in una nuova sessione e verifica stessa disposizione.
5. Scarica il file sorgente.
6. Elimina una copia duplicata e verifica rimozione di record e allegato.

- [ ] **Step 3: Run full code verification**

Run: `npm test && npm run typecheck && NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=build-verification-only npm run build`

Expected: PASS.

- [ ] **Step 4: Commit and push only intended files**

```bash
git status --short
git push origin main
```

Expected: Vercel reports a successful deployment for the pushed commit.
