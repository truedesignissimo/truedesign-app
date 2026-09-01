# Supabase Daily Keep-alive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eseguire gratuitamente una query Supabase di sola lettura ogni giorno per ridurre il rischio di sospensione per inattività.

**Architecture:** Una funzione pura valida il bearer token ed esegue una dipendenza `query`, rendendo autorizzazione ed errori testabili senza rete. Una Route Handler Next.js collega la funzione al client Supabase amministrativo; `vercel.json` registra il cron giornaliero.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase JS, Vitest, Vercel Cron.

## Global Constraints

- La soluzione deve restare completamente gratuita.
- Non deve modificare dati applicativi.
- L'endpoint non deve poter essere usato pubblicamente senza autorizzazione.
- Un fallimento del database deve produrre un errore osservabile nei log Vercel.
- Nessuna nuova dipendenza.

---

### Task 1: Endpoint keep-alive protetto e pianificazione giornaliera

**Files:**
- Create: `src/lib/supabase-keepalive.test.ts`
- Create: `src/lib/supabase-keepalive.ts`
- Create: `src/app/api/cron/supabase-keepalive/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `createAdminClient()` da `src/lib/supabase-admin.ts` e `CRON_SECRET` dall'ambiente Vercel.
- Produces: `executeSupabaseKeepAlive(input): Promise<KeepAliveResponse>` e route `GET /api/cron/supabase-keepalive`.

- [ ] **Step 1: Scrivere i test fallenti**

```ts
import { describe, expect, it, vi } from "vitest";
import { executeSupabaseKeepAlive } from "./supabase-keepalive";

describe("executeSupabaseKeepAlive", () => {
  it("rifiuta richieste senza bearer token valido", async () => {
    const query = vi.fn();
    const result = await executeSupabaseKeepAlive({
      authorization: null,
      secret: "test-secret",
      query,
    });
    expect(result.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("esegue una sola query autorizzata", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const result = await executeSupabaseKeepAlive({
      authorization: "Bearer test-secret",
      secret: "test-secret",
      query,
    });
    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(query).toHaveBeenCalledOnce();
  });

  it("restituisce 503 senza esporre il dettaglio del database", async () => {
    const logger = vi.fn();
    const result = await executeSupabaseKeepAlive({
      authorization: "Bearer test-secret",
      secret: "test-secret",
      query: vi.fn().mockRejectedValue(new Error("database password")),
      logger,
    });
    expect(result).toEqual({ status: 503, body: { ok: false } });
    expect(JSON.stringify(result)).not.toContain("database password");
    expect(logger).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Verificare il rosso**

Run: `npm test -- --run src/lib/supabase-keepalive.test.ts`

Expected: FAIL perché `src/lib/supabase-keepalive.ts` non esiste.

- [ ] **Step 3: Implementare la funzione minima**

```ts
type KeepAliveResponse =
  | { status: 200; body: { ok: true } }
  | { status: 401 | 503; body: { ok: false } };

export async function executeSupabaseKeepAlive(input: {
  authorization: string | null;
  secret: string | undefined;
  query(): Promise<void>;
  logger?: (error: unknown) => void;
}): Promise<KeepAliveResponse> {
  if (!input.secret || input.authorization !== `Bearer ${input.secret}`) {
    return { status: 401, body: { ok: false } };
  }
  try {
    await input.query();
    return { status: 200, body: { ok: true } };
  } catch (error) {
    (input.logger ?? console.error)(error);
    return { status: 503, body: { ok: false } };
  }
}
```

- [ ] **Step 4: Collegare la route a Supabase**

```ts
import { createAdminClient } from "@/lib/supabase-admin";
import { executeSupabaseKeepAlive } from "@/lib/supabase-keepalive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await executeSupabaseKeepAlive({
    authorization: request.headers.get("authorization"),
    secret: process.env.CRON_SECRET,
    async query() {
      const { error } = await createAdminClient()
        .from("apps")
        .select("id")
        .limit(1);
      if (error) throw error;
    },
    logger(error) {
      console.error("[cron/supabase-keepalive] query_failed", error);
    },
  });
  return Response.json(result.body, { status: result.status });
}
```

- [ ] **Step 5: Registrare il cron gratuito giornaliero**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/supabase-keepalive",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 6: Verificare il verde e l'intero progetto**

Run: `npm test -- --run src/lib/supabase-keepalive.test.ts`

Expected: 3 test PASS.

Run: `npm test -- --run && npm run typecheck && npm run build`

Expected: tutti i test PASS, typecheck e build con exit code 0.

- [ ] **Step 7: Commit dell'implementazione**

```bash
git add src/lib/supabase-keepalive.test.ts src/lib/supabase-keepalive.ts src/app/api/cron/supabase-keepalive/route.ts vercel.json docs/superpowers/plans/2026-09-01-supabase-daily-keepalive.md
git commit -m "feat: mantiene attivo Supabase ogni giorno"
```

- [ ] **Step 8: Configurare e verificare produzione**

Impostare `CRON_SECRET` nell'ambiente Production di Vercel, pubblicare su
`main`, attendere il deploy e verificare:

```bash
curl -i https://www.truedesign.app/api/cron/supabase-keepalive
```

Expected: HTTP `401` senza segreto. Una richiesta con il bearer token usato da
Vercel deve restituire HTTP `200`; il cron deve comparire nelle impostazioni
Vercel del progetto.
