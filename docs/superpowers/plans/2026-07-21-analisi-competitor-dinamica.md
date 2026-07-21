# Analisi Competitor dinamica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il report iframe con un'app Next.js nativa, leggera e accessibile, dotata di watchlist privata e ricerca Tavily a consumo controllato.

**Architecture:** La pagina server legge sessione e watchlist da Supabase, mentre un componente client gestisce selezione e feedback. Server Actions modificano la watchlist; un Route Handler autenticato usa una cache Supabase giornaliera e un adapter Tavily con timeout, normalizzando tutte le fonti prima di restituirle.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase SSR/Postgres/RLS, Vitest, CSS Modules, Tavily HTTP API tramite `fetch` nativo.

## Global Constraints

- Non aggiungere librerie UI o runtime.
- Non modificare `apps`, `profiles`, `user_apps` o `usage_log`.
- Non accettare mai `user_id` dal browser; usare sempre `supabase.auth.getUser()` server-side.
- Usare una sola chiamata Tavily `basic`, massimo 8 risultati e timeout di 8 secondi.
- Massimo 5 chiamate esterne per utente/giorno e una chiamata aggiornamenti per azienda/giorno UTC.
- Conservare massimo 600 caratteri per evidenza, 1.200 per riepilogo e 12 aggiornamenti per azienda.
- Non salvare HTML completo, pagine remote, screenshot o immagini remote.
- Conservare Suisse Int’l, token globali True Design, contrasto WCAG AA e target interattivi 44×44 px.
- Non pubblicare, non applicare la migrazione al database live e non eseguire push senza richiesta esplicita.
- Preservare tutte le modifiche e i file non tracciati estranei già presenti.

---

## File map

### Dati e dominio

- `src/app/apps/analisi-competitor/data/baseline.json`: unica copia dei contenuti editoriali estratti dal report.
- `src/app/apps/analisi-competitor/data/baseline.ts`: parsing e tipi della baseline.
- `src/app/apps/analisi-competitor/domain/company.ts`: normalizzazione sicura di nome, dominio e URL.
- `src/app/apps/analisi-competitor/domain/sources.ts`: validazione, deduplica e canonicalizzazione delle fonti.
- `src/app/apps/analisi-competitor/domain/summary.ts`: categorie e sintesi deterministica.
- `src/app/apps/analisi-competitor/domain/diff.ts`: confronto tra ricerche successive.
- `src/app/apps/analisi-competitor/domain/types.ts`: contratti condivisi.

### Persistenza e servizi

- `supabase/migrations/20260722_competitive_intelligence.sql`: tabelle, indici e policy RLS.
- `src/app/apps/analisi-competitor/data/repository.ts`: accesso Supabase, cache, quota e retention.
- `src/app/apps/analisi-competitor/services/search-provider.ts`: interfaccia provider.
- `src/app/apps/analisi-competitor/services/tavily.ts`: chiamata HTTP Tavily.
- `src/app/apps/analisi-competitor/services/research.ts`: orchestrazione cache → provider → normalizzazione → persistenza.

### HTTP e UI

- `src/app/apps/analisi-competitor/actions.ts`: aggiunta/rimozione watchlist.
- `src/app/apps/analisi-competitor/api/research/route.ts`: endpoint ricerca autenticato.
- `src/app/apps/analisi-competitor/components/*.tsx`: shell, ricerca, selettore, dettaglio, fonti e archivio.
- `src/app/apps/analisi-competitor/competitive-intelligence.tsx`: stato client e coordinamento UI.
- `src/app/apps/analisi-competitor/analisi-competitor.module.css`: stile isolato.
- `src/app/apps/analisi-competitor/page.tsx`: pagina server nativa.
- `public/apps/analisi-competitor/assets/logos/*`: loghi trasparenti curati.
- `public/apps/analisi-competitor/index.html`: rimosso soltanto al cutover finale.

---

### Task 1: Baseline editoriale canonica

**Files:**
- Create: `src/app/apps/analisi-competitor/data/baseline.json`
- Create: `src/app/apps/analisi-competitor/data/baseline.ts`
- Create: `src/app/apps/analisi-competitor/data/baseline.test.ts`
- Read: `public/apps/analisi-competitor/index.html`

**Interfaces:**
- Produces: `getBaseline(): CompetitiveBaseline` e tipi `BaselineBrand`, `BaselineTheme`.
- Consumes: JSON del tag `<script id="site-data">` nel report statico.

- [ ] **Step 1: Scrivere il test fallente di parità**

```ts
import { describe, expect, it } from "vitest";
import { getBaseline } from "./baseline";

describe("competitive intelligence baseline", () => {
  it("preserva brand, watchlist e temi del report pubblicato", () => {
    const baseline = getBaseline();
    expect(baseline.brand_count).toBe(19);
    expect(baseline.brands).toHaveLength(19);
    expect(baseline.watchlist_brands).toHaveLength(16);
    expect(baseline.themes).toHaveLength(8);
    expect(baseline.brands[0]).toMatchObject({ slug: "arper", name: "Arper" });
  });

  it("non conserva favicon Google", () => {
    const serialized = JSON.stringify(getBaseline());
    expect(serialized).not.toContain("google.com/s2/favicons");
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/data/baseline.test.ts`

Expected: FAIL perché `./baseline` non esiste.

- [ ] **Step 3: Estrarre il JSON e aggiungere il parser tipizzato**

Creare `baseline.json` copiando esattamente il JSON di `site-data`, rimuovendo soltanto tutti i campi `logo_url`. Creare:

```ts
import rawBaseline from "./baseline.json";

export type BaselineBrand = {
  slug: string;
  name: string;
  tier: string;
  country?: string | null;
  url: string;
  score_overall?: number | null;
  rank?: number | null;
  comment?: string | null;
  notable_ideas?: string[];
  last_update_detected?: string | null;
  images?: Array<{ path: string; role: string; page_title: string }>;
  links?: Array<{ title: string; url: string; page_type: string }>;
};

export type BaselineTheme = {
  key: string;
  label: string;
  overview: string;
  brands: Array<{ slug: string; name: string; url: string; title: string; note: string }>;
};

export type CompetitiveBaseline = {
  generated_at: string;
  brand_count: number;
  brands: BaselineBrand[];
  watchlist_brands: BaselineBrand[];
  themes: BaselineTheme[];
};

export function getBaseline(): CompetitiveBaseline {
  return structuredClone(rawBaseline) as CompetitiveBaseline;
}
```

- [ ] **Step 4: Eseguire test e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor/data/baseline.test.ts && npm run typecheck`

Expected: 2 test PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor/data
git commit -m "refactor: estrae baseline competitor tipizzata"
```

### Task 2: Dominio puro per aziende, fonti, sintesi e diff

**Files:**
- Create: `src/app/apps/analisi-competitor/domain/types.ts`
- Create: `src/app/apps/analisi-competitor/domain/company.ts`
- Create: `src/app/apps/analisi-competitor/domain/company.test.ts`
- Create: `src/app/apps/analisi-competitor/domain/sources.ts`
- Create: `src/app/apps/analisi-competitor/domain/sources.test.ts`
- Create: `src/app/apps/analisi-competitor/domain/summary.ts`
- Create: `src/app/apps/analisi-competitor/domain/summary.test.ts`
- Create: `src/app/apps/analisi-competitor/domain/diff.ts`
- Create: `src/app/apps/analisi-competitor/domain/diff.test.ts`

**Interfaces:**
- Produces: `normalizeCompanyUrl`, `normalizeSources`, `buildSummary`, `diffResearch`.
- Consumes: nessun servizio esterno; funzioni pure.

- [ ] **Step 1: Scrivere i test fallenti dei contratti di sicurezza**

```ts
import { describe, expect, it } from "vitest";
import { normalizeCompanyUrl } from "./company";

describe("normalizeCompanyUrl", () => {
  it("normalizza un dominio pubblico HTTPS", () => {
    expect(normalizeCompanyUrl("www.arper.com/news")).toEqual({
      normalizedDomain: "arper.com",
      websiteUrl: "https://arper.com",
    });
  });

  it.each(["http://localhost", "https://127.0.0.1", "ftp://arper.com", "https://u:p@arper.com", "https://arper.com:8443"])(
    "rifiuta URL pericoloso %s",
    (value) => expect(() => normalizeCompanyUrl(value)).toThrow()
  );
});
```

```ts
import { describe, expect, it } from "vitest";
import { normalizeSources } from "./sources";

describe("normalizeSources", () => {
  it("deduplica URL, tronca evidenze e non inventa date", () => {
    const sources = normalizeSources([
      { title: "New collection", url: "https://example.com/news?a=1&utm_source=x", content: "x".repeat(900), publishedDate: null },
      { title: "Duplicate", url: "https://example.com/news?a=1", content: "same", publishedDate: null },
    ]);
    expect(sources).toHaveLength(1);
    expect(sources[0].evidence).toHaveLength(600);
    expect(sources[0].publishedAt).toBeNull();
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { buildSummary } from "./summary";
import { diffResearch } from "./diff";

describe("summary and diff", () => {
  it("classifica segnali e limita il riepilogo", () => {
    const result = buildSummary([{ id: "s1", title: "New sustainable collection", url: "https://e.test/a", source: "e.test", evidence: "Launch", publishedAt: null }]);
    expect(result.categories).toEqual(["collezione", "sostenibilità"]);
    expect(result.text.length).toBeLessThanOrEqual(1200);
  });

  it("identifica soltanto fonti nuove o cambiate", () => {
    expect(diffResearch(["a:1", "b:1"], ["a:1", "b:2", "c:1"])).toEqual({ added: ["c:1"], changed: ["b:2"] });
  });
});
```

- [ ] **Step 2: Verificare che i quattro test file falliscano**

Run: `npm test -- src/app/apps/analisi-competitor/domain`

Expected: FAIL per moduli mancanti.

- [ ] **Step 3: Implementare i contratti minimi**

In `types.ts` definire:

```ts
export type ResearchSource = { id: string; title: string; url: string; source: string; evidence: string; publishedAt: string | null };
export type ResearchSummary = { text: string; categories: string[] };
export type ResearchDiff = { added: string[]; changed: string[] };
export type SearchProviderResult = { title: string; url: string; content: string; publishedDate: string | null };
export type CompanyRecord = { id: string; name: string; normalizedDomain: string; websiteUrl: string; logoPath: string | null };
export type CompanyCandidate = { name: string; normalizedDomain: string; websiteUrl: string };
export type ResearchResult = { cached: boolean; sources: ResearchSource[]; summary: ResearchSummary; diff: ResearchDiff; fetchedAt: string; warning?: string };
```

Implementare `normalizeCompanyUrl` con `new URL`, `domainToASCII` da `node:url`, rimozione `www.`, protocollo HTTPS obbligatorio e rifiuto di hostname locali/IP/credenziali/porte. Implementare `normalizeSources` con rimozione parametri `utm_*`, chiave URL canonica, allowlist HTTPS e `slice(0, 600)`. Implementare `buildSummary` concatenando al massimo tre titoli/evidenze e categorie rilevate da mappe di parole chiave italiane/inglesi. Implementare `diffResearch` confrontando la parte URL prima di `:` e il fingerprint completo.

- [ ] **Step 4: Verificare test e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor/domain && npm run typecheck`

Expected: tutti i test dominio PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor/domain
git commit -m "feat: aggiunge dominio sicuro competitive intelligence"
```

### Task 3: Migrazione Supabase e contratto RLS

**Files:**
- Create: `supabase/migrations/20260722_competitive_intelligence.sql`
- Create: `src/app/apps/analisi-competitor/data/schema-contract.test.ts`

**Interfaces:**
- Produces: `ci_companies`, `ci_watchlist_items`, `ci_search_runs` e policy RLS.
- Consumes: `auth.users(id)` e funzione esistente `public.set_updated_at()` soltanto se disponibile; la migrazione non deve dipendere da essa.

- [ ] **Step 1: Scrivere il test fallente del contratto SQL**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260722_competitive_intelligence.sql", "utf8");

describe("competitive intelligence migration", () => {
  it("crea tre tabelle con RLS senza modificare tabelle piattaforma", () => {
    expect(migration).toContain("create table if not exists public.ci_companies");
    expect(migration).toContain("create table if not exists public.ci_watchlist_items");
    expect(migration).toContain("create table if not exists public.ci_search_runs");
    expect(migration).toMatch(/ci_watchlist_items[\s\S]*enable row level security/i);
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).not.toMatch(/alter table public\.(apps|profiles|user_apps|usage_log)/i);
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/data/schema-contract.test.ts`

Expected: FAIL `ENOENT` per migrazione mancante.

- [ ] **Step 3: Scrivere la migrazione completa**

La migrazione deve includere UUID `gen_random_uuid()`, timestamp UTC, check su `kind` e `status`, JSONB con default, indice `(company_id, fetched_at desc)`, indice `(requested_by, fetched_at desc)`, `cache_key unique`, RLS su tutte le tabelle, policy `select` authenticated per `ci_companies`, policy own-row `select/insert/delete` per `ci_watchlist_items`, e nessuna policy client su `ci_search_runs`.

```sql
create table if not exists public.ci_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  normalized_domain text not null unique,
  website_url text not null,
  logo_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.ci_watchlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.ci_companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table if not exists public.ci_search_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('company_discovery', 'company_update')),
  company_id uuid references public.ci_companies(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  query_hash text not null,
  cache_key text not null unique,
  provider text not null default 'tavily',
  status text not null check (status in ('running', 'succeeded', 'failed')),
  results jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  fingerprint text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  error_code text,
  check ((kind = 'company_discovery' and company_id is null) or (kind = 'company_update' and company_id is not null))
);
```

- [ ] **Step 4: Eseguire il test del contratto e diff check**

Run: `npm test -- src/app/apps/analisi-competitor/data/schema-contract.test.ts && git diff --check`

Expected: test PASS; diff check senza output.

- [ ] **Step 5: Commit selettivo**

```bash
git add supabase/migrations/20260722_competitive_intelligence.sql src/app/apps/analisi-competitor/data/schema-contract.test.ts
git commit -m "feat: aggiunge schema RLS competitive intelligence"
```

### Task 4: Tavily adapter e servizio ricerca a consumo controllato

**Files:**
- Create: `src/app/apps/analisi-competitor/services/search-provider.ts`
- Create: `src/app/apps/analisi-competitor/services/tavily.ts`
- Create: `src/app/apps/analisi-competitor/services/tavily.test.ts`
- Create: `src/app/apps/analisi-competitor/services/research.ts`
- Create: `src/app/apps/analisi-competitor/services/research.test.ts`
- Create: `src/app/apps/analisi-competitor/services/discovery.ts`
- Create: `src/app/apps/analisi-competitor/services/discovery.test.ts`
- Create: `src/app/apps/analisi-competitor/data/repository.ts`

**Interfaces:**
- Produces: `SearchProvider.search(input)`, `createTavilyProvider(fetcher)`, `researchCompany(deps, input)`, `discoverCompanies(deps, input)`.
- Consumes: funzioni Task 2 e tabelle Task 3.

- [ ] **Step 1: Scrivere test fallenti per payload, timeout e cache**

```ts
import { describe, expect, it, vi } from "vitest";
import { createTavilyProvider } from "./tavily";

describe("Tavily provider", () => {
  it("usa una ricerca basic con massimo otto risultati", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const provider = createTavilyProvider(fetcher, "secret");
    await provider.search({ query: "Arper updates", maxResults: 8 });
    const body = JSON.parse(fetcher.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ search_depth: "basic", max_results: 8, include_answer: false, include_raw_content: false });
  });
});
```

```ts
import { describe, expect, it, vi } from "vitest";
import { researchCompany } from "./research";

describe("researchCompany", () => {
  it("restituisce la cache senza chiamare il provider", async () => {
    const cached = { id: "run-1", results: [], summary: {}, fetched_at: "2026-07-21T00:00:00Z" };
    const deps = { repository: { findCached: vi.fn().mockResolvedValue(cached) }, provider: { search: vi.fn() } };
    expect(await researchCompany(deps as never, { userId: "u1", company: { id: "c1", name: "Arper", normalizedDomain: "arper.com" }, now: new Date("2026-07-21T12:00:00Z") })).toMatchObject({ cached: true });
    expect(deps.provider.search).not.toHaveBeenCalled();
  });
});
```

```ts
import { describe, expect, it, vi } from "vitest";
import { discoverCompanies } from "./discovery";

describe("discoverCompanies", () => {
  it("restituisce al massimo tre candidati e usa la quota condivisa", async () => {
    const deps = {
      repository: {
        findCached: vi.fn().mockResolvedValue(null),
        countDailyExternalRuns: vi.fn().mockResolvedValue(4),
        claimRun: vi.fn().mockResolvedValue({ id: "run-1" }),
        completeRun: vi.fn(),
      },
      provider: {
        search: vi.fn().mockResolvedValue([
          { title: "Arper", url: "https://www.arper.com", content: "Official website", publishedDate: null },
          { title: "Arper News", url: "https://www.arper.com/news", content: "News", publishedDate: null },
          { title: "Arper on Dezeen", url: "https://www.dezeen.com/tag/arper", content: "Editorial", publishedDate: null },
          { title: "Extra", url: "https://example.com", content: "Extra", publishedDate: null },
        ]),
      },
    };
    const result = await discoverCompanies(deps as never, { userId: "u1", query: "Arper", now: new Date("2026-07-21T12:00:00Z") });
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(deps.repository.countDailyExternalRuns).toHaveBeenCalledWith("u1", "2026-07-21");
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/services`

Expected: FAIL per moduli mancanti.

- [ ] **Step 3: Implementare adapter, repository e orchestrazione**

```ts
import type { SearchProviderResult } from "../domain/types";

export type SearchInput = { query: string; maxResults: number };
export interface SearchProvider { search(input: SearchInput): Promise<SearchProviderResult[]> }
```

`createTavilyProvider` deve chiamare `https://api.tavily.com/search` con `Authorization: Bearer`, `AbortSignal.timeout(8000)`, `search_depth: "basic"`, `max_results: Math.min(input.maxResults, 8)`, `include_answer: false` e `include_raw_content: false`. `researchCompany` deve costruire una `cache_key` giornaliera UTC, leggere cache, contare massimo 5 run esterni del giorno per `requested_by`, tentare insert `running`, gestire conflitto cache, chiamare il provider una volta, normalizzare, riassumere, salvare `succeeded` o `failed`, applicare retention e restituire l'ultimo successo in fallback.

`discoverCompanies` deve normalizzare la query, usare `cache_key` `company_discovery:<sha256-query>:<YYYY-MM-DD>`, applicare la stessa quota personale di 5 chiamate esterne, richiedere al provider massimo 5 risultati ma restituire massimo 3 domini HTTPS distinti, salvare `kind = company_discovery` e rimuovere i run discovery più vecchi di 7 giorni. La conferma di un candidato passa poi a `addWatchlistCompany`.

- [ ] **Step 4: Eseguire test servizi e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor/services && npm run typecheck`

Expected: test PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor/services src/app/apps/analisi-competitor/data/repository.ts
git commit -m "feat: aggiunge ricerca Tavily con cache e quota"
```

### Task 5: Watchlist server-side senza IDOR

**Files:**
- Create: `src/app/apps/analisi-competitor/actions.ts`
- Create: `src/app/apps/analisi-competitor/actions.test.ts`

**Interfaces:**
- Produces: `addWatchlistCompany(input)` e `removeWatchlistCompany(companyId)`.
- Consumes: `createClient`, `createAdminClient`, `normalizeCompanyUrl`.

- [ ] **Step 1: Scrivere i test fallenti sull'identità server-side**

```ts
import { describe, expect, it } from "vitest";
import { isWatchlistInput } from "./actions";

describe("watchlist actions", () => {
  it("accetta soltanto nome e sito, mai user_id", () => {
    expect(isWatchlistInput({ name: "Arper", websiteUrl: "arper.com" })).toBe(true);
    expect(isWatchlistInput({ name: "Arper", websiteUrl: "arper.com", user_id: "attacker" })).toBe(false);
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/actions.test.ts`

Expected: FAIL perché `isWatchlistInput` non esiste.

- [ ] **Step 3: Implementare validazione e Server Actions**

```ts
export type WatchlistInput = { name: string; websiteUrl: string };

export function isWatchlistInput(value: unknown): value is WatchlistInput {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return keys.join(",") === "name,websiteUrl" &&
    typeof (value as WatchlistInput).name === "string" &&
    typeof (value as WatchlistInput).websiteUrl === "string";
}
```

Le azioni devono iniziare con `"use server"`, chiamare `getUser()`, restituire `{ ok: false, error: "Sessione scaduta" }` senza utente, usare `user.id` ricavato dalla sessione, upsert dell'azienda normalizzata via admin e insert/delete della relazione usando il client autenticato soggetto a RLS. Non usare parametri liberi per `user_id`.

- [ ] **Step 4: Verificare test e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor/actions.test.ts && npm run typecheck`

Expected: test PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor/actions.ts src/app/apps/analisi-competitor/actions.test.ts
git commit -m "feat: aggiunge watchlist competitor privata"
```

### Task 6: Shell e componenti accessibili

**Files:**
- Create: `src/app/apps/analisi-competitor/components/company-search.tsx`
- Create: `src/app/apps/analisi-competitor/components/watchlist-selector.tsx`
- Create: `src/app/apps/analisi-competitor/components/company-detail.tsx`
- Create: `src/app/apps/analisi-competitor/components/editorial-archive.tsx`
- Create: `src/app/apps/analisi-competitor/components/ui-contract.test.tsx`
- Create: `src/app/apps/analisi-competitor/analisi-competitor.module.css`
- Create: `src/app/apps/analisi-competitor/competitive-intelligence.tsx`

**Interfaces:**
- Produces: `CompetitiveIntelligence`, `CompanySearch`, `WatchlistSelector`, `CompanyDetail`, `EditorialArchive`.
- Consumes: baseline Task 1, tipi Task 2, actions Task 5.

- [ ] **Step 1: Scrivere test fallente del markup accessibile**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WatchlistSelector from "./watchlist-selector";

describe("watchlist selector", () => {
  it("espone nomi, stato selezionato e fallback senza favicon Google", () => {
    const html = renderToStaticMarkup(<WatchlistSelector companies={[{ id: "c1", name: "Arper", normalizedDomain: "arper.com", websiteUrl: "https://arper.com", logoPath: null }]} selectedId="c1" onSelect={() => undefined} />);
    expect(html).toContain('aria-label="Apri Arper"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("arper.com");
    expect(html).not.toContain("google.com/s2/favicons");
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/components/ui-contract.test.tsx`

Expected: FAIL per componente mancante.

- [ ] **Step 3: Implementare componenti e CSS Module**

Il selettore deve usare `button`, `aria-pressed`, `aria-describedby`, tooltip sempre nel DOM e visibile su `:hover`/`:focus-visible`; la superficie cliccabile deve essere 44px e il logo 28px. `CompanySearch` deve avere label visibile e messaggi in `<div role="status" aria-live="polite">`. `CompanyDetail` deve separare `<section>` per verificati, riepilogo e lettura True. `EditorialArchive` deve renderizzare classifica, temi e insight dalla baseline senza `dangerouslySetInnerHTML`.

Il CSS deve usare soltanto token globali, griglia 8px, `border: 1px solid var(--border)`, `background: var(--bg)`, `color: var(--text)`, `font-family: "Suisse Intl"`, breakpoint a 760px e blocco `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 4: Eseguire test UI e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor/components/ui-contract.test.tsx && npm run typecheck`

Expected: test PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor/components src/app/apps/analisi-competitor/competitive-intelligence.tsx src/app/apps/analisi-competitor/analisi-competitor.module.css
git commit -m "feat: costruisce interfaccia competitor nativa"
```

### Task 7: Route ricerca autenticata e integrazione pagina

**Files:**
- Create: `src/app/apps/analisi-competitor/api/research/validation.ts`
- Create: `src/app/apps/analisi-competitor/api/research/validation.test.ts`
- Create: `src/app/apps/analisi-competitor/api/research/route.ts`
- Create: `src/app/apps/analisi-competitor/api/companies/validation.ts`
- Create: `src/app/apps/analisi-competitor/api/companies/validation.test.ts`
- Create: `src/app/apps/analisi-competitor/api/companies/route.ts`
- Modify: `src/app/apps/analisi-competitor/competitive-intelligence.tsx`
- Modify: `src/app/apps/analisi-competitor/page.tsx`

**Interfaces:**
- Produces: `POST /apps/analisi-competitor/api/research`, `POST /apps/analisi-competitor/api/companies` e pagina server completa.
- Consumes: `researchCompany`, `discoverCompanies`, repository Supabase e componenti Task 6.

- [ ] **Step 1: Scrivere test fallente del payload**

```ts
import { describe, expect, it } from "vitest";
import { parseResearchRequest } from "./validation";

describe("research request", () => {
  it("accetta soltanto companyId", () => {
    expect(parseResearchRequest({ companyId: "e67f1037-1e7a-49c7-8103-6fe001110bf7" })).toEqual({ companyId: "e67f1037-1e7a-49c7-8103-6fe001110bf7" });
    expect(() => parseResearchRequest({ companyId: "x", user_id: "attacker" })).toThrow();
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { parseCompanyDiscoveryRequest } from "./validation";

describe("company discovery request", () => {
  it("accetta soltanto una query breve e non accetta user_id", () => {
    expect(parseCompanyDiscoveryRequest({ query: "Arper" })).toEqual({ query: "Arper" });
    expect(() => parseCompanyDiscoveryRequest({ query: "Arper", user_id: "attacker" })).toThrow();
    expect(() => parseCompanyDiscoveryRequest({ query: "x".repeat(161) })).toThrow();
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

Run: `npm test -- src/app/apps/analisi-competitor/api/research/validation.test.ts src/app/apps/analisi-competitor/api/companies/validation.test.ts`

Expected: FAIL per modulo mancante.

- [ ] **Step 3: Implementare validation, route e pagina server**

`parseResearchRequest` deve accettare un oggetto con la sola chiave `companyId` UUID. `parseCompanyDiscoveryRequest` deve accettare un oggetto con la sola chiave `query`, lunghezza 2–160 caratteri. Entrambe le route devono verificare same-origin, `application/json`, content-length massimo 2.048 byte, sessione con `getUser` e `TAVILY_API_KEY` presente, mappando errori in codici 400/401/403/413/415/429/502 senza dettagli sensibili. La route research verifica inoltre che l'azienda esista; la route companies restituisce massimo 3 candidati senza salvarli in `ci_companies` prima della conferma.

`page.tsx` deve diventare Server Component, chiamare `getUser()`, fare `redirect("/login")` se necessario, leggere watchlist dell'utente e baseline, poi rendere:

```tsx
return <CompetitiveIntelligence initialCompanies={companies} baseline={getBaseline()} />;
```

Il client deve chiamare la route research soltanto quando l'azienda selezionata non ha dati caricati, impedire richieste parallele con stato `loadingCompanyId` e mostrare cache/errori inline. `CompanySearch` deve interrogare prima le aziende già caricate; per una query non trovata chiama la route companies, mostra massimo 3 candidati e invia il candidato confermato a `addWatchlistCompany`.

- [ ] **Step 4: Eseguire test mirati, suite e typecheck**

Run: `npm test -- src/app/apps/analisi-competitor && npm run typecheck`

Expected: tutti i test app PASS; typecheck exit 0.

- [ ] **Step 5: Commit selettivo**

```bash
git add src/app/apps/analisi-competitor
git commit -m "feat: integra ricerca competitor autenticata"
```

### Task 8: Cutover, asset locali e verifica completa

**Files:**
- Create: `public/apps/analisi-competitor/assets/logos/*.svg` o `*.png`
- Modify: `src/app/apps/analisi-competitor/data/baseline.json`
- Delete: `public/apps/analisi-competitor/index.html`
- Modify: `.env.local.example`

**Interfaces:**
- Produces: app nativa unica, senza iframe e senza favicon Google.
- Consumes: tutti i task precedenti.

- [ ] **Step 1: Aggiungere test fallente di cutover**

Aggiungere a `baseline.test.ts`:

```ts
import { existsSync } from "node:fs";

it("non mantiene il renderer HTML legacy", () => {
  expect(existsSync("public/apps/analisi-competitor/index.html")).toBe(false);
});
```

- [ ] **Step 2: Verificare che fallisca finché l'iframe esiste**

Run: `npm test -- src/app/apps/analisi-competitor/data/baseline.test.ts`

Expected: FAIL perché `index.html` esiste.

- [ ] **Step 3: Completare il cutover**

Salvare soltanto loghi trasparenti ottenuti da asset ufficiali e con dimensioni contenute; associare `logo_path` ai brand noti. Se un logo ufficiale non è disponibile, lasciare `logo_path` nullo e usare il fallback testuale. Rimuovere `public/apps/analisi-competitor/index.html`. Aggiungere a `.env.local.example` soltanto:

```dotenv
TAVILY_API_KEY=
```

- [ ] **Step 4: Verifica automatica completa**

Run: `npm test && npm run typecheck && npm run build && git diff --check`

Expected: 0 test falliti; typecheck exit 0; build Next.js completata; diff check senza output.

- [ ] **Step 5: Verifica manuale locale**

Run: `npm run dev`

Verificare a 1440px e 390px: gerarchia, overflow, tooltip hover/focus, navigazione tastiera, conferma rimozione, stati loading/error/empty, `prefers-reduced-motion`, assenza di richieste Google favicon e assenza di chiamate Tavily ripetute nella stessa giornata.

- [ ] **Step 6: Commit finale selettivo**

```bash
git add src/app/apps/analisi-competitor public/apps/analisi-competitor .env.local.example
git commit -m "feat: completa competitive intelligence leggera"
```

- [ ] **Step 7: Handoff senza pubblicazione**

Riportare commit creati, test/typecheck/build/diff check, eventuali verifiche non eseguibili per assenza di Supabase o `TAVILY_API_KEY`, e confermare esplicitamente che non sono stati eseguiti push, migrazioni live o pubblicazione.
