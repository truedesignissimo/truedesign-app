# User Assignments and Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere affidabili assegnazioni, dashboard, saluto, card applicazione e reportistica di login/aperture app.

**Architecture:** `user_apps` rimane la fonte delle autorizzazioni e viene sincronizzata lato server tramite una policy pura per ruolo. Login e aperture app restano eventi separati (`access_log` e `usage_log`), aggregati da funzioni pure e mostrati nella reportistica amministrativa.

**Tech Stack:** Next.js 15 App Router, TypeScript, React, Supabase Auth/Postgres, Vitest, CSS esistente.

## Global Constraints

- Il valore database e la dicitura `cliente` / **Cliente** non cambiano.
- Team interno riceve tutte le app attive; Cliente riceve solo `/apps/true-sondaggio-iconici`.
- Nessun nuovo pacchetto UI.
- Nessun IP o user-agent viene registrato.
- L’identità utente deriva sempre dalla sessione verificata lato server.
- Le card rispettano `DESIGN_SYSTEM.md`, Suisse Int’l e la palette True esistente.

---

### Task 1: Policy delle assegnazioni

**Files:**
- Create: `src/lib/user-app-policy.ts`
- Create: `src/lib/user-app-policy.test.ts`

**Interfaces:**
- Produces: `defaultAppIdsForRole(role, apps): string[]`
- Produces: `assignmentDelta(currentIds, desiredIds): { add: string[]; remove: string[] }`

- [ ] **Step 1: Write failing tests**

```ts
expect(defaultAppIdsForRole("interno", apps)).toEqual(["a", "survey"]);
expect(defaultAppIdsForRole("cliente", apps)).toEqual(["survey"]);
expect(assignmentDelta(["a"], ["survey"])).toEqual({
  add: ["survey"],
  remove: ["a"],
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/user-app-policy.test.ts`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Implement pure policy**

```ts
export type UserRole = "interno" | "cliente";
export type AssignableApp = { id: string; url: string | null };

export function defaultAppIdsForRole(role: UserRole, apps: AssignableApp[]) {
  return role === "interno"
    ? apps.map((app) => app.id)
    : apps.filter((app) => app.url === "/apps/true-sondaggio-iconici").map((app) => app.id);
}

export function assignmentDelta(currentIds: string[], desiredIds: string[]) {
  const current = new Set(currentIds);
  const desired = new Set(desiredIds);
  return {
    add: desiredIds.filter((id) => !current.has(id)),
    remove: currentIds.filter((id) => !desired.has(id)),
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/lib/user-app-policy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/user-app-policy.ts src/lib/user-app-policy.test.ts
git commit -m "feat: definisce assegnazioni predefinite per ruolo"
```

### Task 2: Sincronizzazione server e azioni massive

**Files:**
- Create: `src/lib/user-app-sync.ts`
- Create: `src/lib/user-app-sync.test.ts`
- Modify: `src/app/admin/assignments/actions.ts`

**Interfaces:**
- Consumes: `assignmentDelta`
- Produces: `syncUserApps(userId, desiredIds, gateway)`
- Produces server actions: `assignAllApps(userId)`, `excludeAllApps(userId)`

- [ ] **Step 1: Write failing synchronization tests**

```ts
await syncUserApps("u1", ["a", "b"], gateway);
expect(gateway.add).toHaveBeenCalledWith("u1", ["b"]);
expect(gateway.remove).toHaveBeenCalledWith("u1", ["c"]);
```

Include a test proving that an empty desired set removes every current
assignment and an already-correct set performs no writes.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/user-app-sync.test.ts`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Implement synchronization**

```ts
export async function syncUserApps(
  userId: string,
  desiredIds: string[],
  gateway: {
    list(userId: string): Promise<string[]>;
    add(userId: string, appIds: string[]): Promise<void>;
    remove(userId: string, appIds: string[]): Promise<void>;
  }
) {
  const current = await gateway.list(userId);
  const delta = assignmentDelta(current, desiredIds);
  if (delta.add.length) await gateway.add(userId, delta.add);
  if (delta.remove.length) await gateway.remove(userId, delta.remove);
  return desiredIds;
}
```

- [ ] **Step 4: Add actions**

Use `upsert(..., { onConflict: "user_id,app_id", ignoreDuplicates: true })`
for additions. For removals use `.in("app_id", ids)`. `setUserType` loads active
apps with `id,url`, calculates defaults, synchronizes assignments, then updates
the profile. `assignAllApps` synchronizes all active IDs; `excludeAllApps`
synchronizes `[]`.

- [ ] **Step 5: Verify**

Run: `npm test -- src/lib/user-app-sync.test.ts src/lib/user-app-policy.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/user-app-sync.ts src/lib/user-app-sync.test.ts src/app/admin/assignments/actions.ts
git commit -m "fix: sincronizza assegnazioni utenti"
```

### Task 3: Default in approvazione e invito

**Files:**
- Modify: `src/lib/registration-approval.ts`
- Modify: `src/lib/registration-approval.test.ts`
- Modify: `src/lib/supabase-registration-approval.ts`
- Modify: `src/app/admin/assignments/actions.ts`

**Interfaces:**
- Consumes: `defaultAppIdsForRole`
- `PendingAccount` gains `userType: UserRole`
- `ApprovalGateway.listActiveApps()` returns `{id,url}[]`

- [ ] **Step 1: Change tests first**

Add two cases:

```ts
expect(internalGateway.assignApps).toHaveBeenCalledWith("u1", ["a", "survey"]);
expect(clientGateway.assignApps).toHaveBeenCalledWith("u2", ["survey"]);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/registration-approval.test.ts`

Expected: FAIL perché l’approvazione corrente assegna tutte le app.

- [ ] **Step 3: Implement role-aware approval**

Read `user_type` with the profile, calculate desired IDs with
`defaultAppIdsForRole`, and synchronize only the missing defaults. Manual
admin invitations call the same synchronization after profile creation.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/lib/registration-approval.test.ts src/app/admin/assignments/invitation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/registration-approval.ts src/lib/registration-approval.test.ts src/lib/supabase-registration-approval.ts src/app/admin/assignments/actions.ts
git commit -m "fix: assegna app predefinite per profilo"
```

### Task 4: Pannello assegnazioni

**Files:**
- Modify: `src/app/admin/assignments/user-app-matrix.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes server actions `assignAllApps`, `excludeAllApps`

- [ ] **Step 1: Add component behavior tests or pure state helper tests**

Extract a small immutable helper if needed:

```ts
replaceUserAssignments(current, "u1", ["a", "b"])
```

Assert other users remain unchanged.

- [ ] **Step 2: Verify RED**

Run the new targeted test and confirm the helper is missing.

- [ ] **Step 3: Add controls**

Inside `.permissions-list`, before checkboxes:

```tsx
<div className="permissions-bulk-actions">
  <button type="button" onClick={() => handleAssignAll(user)}>Assegna tutte</button>
  <button type="button" onClick={() => handleExcludeAll(user)}>Escludi tutte</button>
</div>
```

Update local assignments from the server result; close details on success.
Use disabled/loading state per user and accessible focus styles.

- [ ] **Step 4: Verify**

Run targeted tests and `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/assignments/user-app-matrix.tsx src/app/globals.css
git commit -m "feat: aggiunge comandi massivi per le app"
```

### Task 5: Dashboard e nome di battesimo

**Files:**
- Create: `src/lib/person-name.ts`
- Create: `src/lib/person-name.test.ts`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Produces: `firstName({ profileName, metadataFirstName, metadataFullName, email }): string`

- [ ] **Step 1: Write failing name tests**

```ts
expect(firstName({ profileName: "Dario Breggie" })).toBe("Dario");
expect(firstName({ metadataFirstName: "Maurizio", email: "wrong@example.com" })).toBe("Maurizio");
expect(firstName({ email: "dario.breggie@truedesign.it" })).toBe("dario");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/person-name.test.ts`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Implement name resolver and dashboard data read**

After `supabase.auth.getUser()`, use the admin client for the profile and the
current user’s `user_apps` join. The `user.id` always comes from the verified
session. Show `Ciao, ${firstName(...)}.` for administrators and normal users.

- [ ] **Step 4: Verify**

Run: `npm test -- src/lib/person-name.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/person-name.ts src/lib/person-name.test.ts src/app/dashboard/page.tsx
git commit -m "fix: mostra nome e assegnazioni corrette in dashboard"
```

### Task 6: Tracciamento login

**Files:**
- Create: `supabase/migrations/20260730_create_access_log.sql`
- Create: `src/lib/access-log.ts`
- Create: `src/lib/access-log.test.ts`
- Create: `src/app/login/actions.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/_components/home-login.tsx`

**Interfaces:**
- Produces: `recordWorkspaceAccess(source: "homepage" | "login")`
- Produces: `recordAuthenticatedAccess(source, gateway)`

- [ ] **Step 1: Write failing test**

Assert the gateway receives only the user ID returned by `getAuthenticatedUser`
and never a client-provided ID. Assert missing sessions return `{ok:false}`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/access-log.test.ts`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Add migration**

```sql
create table if not exists public.access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('homepage', 'login')),
  accessed_at timestamptz not null default now()
);
alter table public.access_log enable row level security;
create index if not exists access_log_accessed_at_idx
  on public.access_log (accessed_at desc);
create index if not exists access_log_user_id_idx
  on public.access_log (user_id);
```

No client policies are added; writes and reporting use the server service role.

- [ ] **Step 4: Implement and connect both forms**

After successful authentication and profile validation, call
`recordWorkspaceAccess("login")` or `"homepage"` in a best-effort `try/catch`,
then navigate. A logging outage must not block a valid login.

- [ ] **Step 5: Verify**

Run: `npm test -- src/lib/access-log.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260730_create_access_log.sql src/lib/access-log.ts src/lib/access-log.test.ts src/app/login/actions.ts src/app/login/page.tsx src/app/_components/home-login.tsx
git commit -m "feat: registra accessi al workspace"
```

### Task 7: Reportistica separata e verificabile

**Files:**
- Create: `src/lib/usage-report.ts`
- Create: `src/lib/usage-report.test.ts`
- Modify: `src/app/admin/usage/page.tsx`

**Interfaces:**
- Produces: `buildUsageReport({ accessLogs, usageLogs, users, profiles })`

- [ ] **Step 1: Write failing aggregation tests**

Use two users, two login events and three app openings. Assert:

```ts
expect(report.totalLogins).toBe(2);
expect(report.totalAppOpens).toBe(3);
expect(report.appUsers).toHaveLength(2);
expect(report.loginUsers).toHaveLength(2);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/usage-report.test.ts`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Implement aggregator and page**

Load both tables with the admin client. Render separate KPI and chronological
tables named **Accessi al workspace** and **Aperture delle app**. If either
query fails, show a specific error message rather than zero.

- [ ] **Step 4: Verify**

Run: `npm test -- src/lib/usage-report.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/usage-report.ts src/lib/usage-report.test.ts src/app/admin/usage/page.tsx
git commit -m "feat: separa login e utilizzo app nei report"
```

### Task 8: Card applicazione

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Implement layout**

Make `.app-card-content` position relative and keep the title at the bottom.
Center `.app-card-icon` absolutely at `50% 50%`, translate `-50% -50%`, and
increase the width while retaining a safe maximum. Preserve current hover and
focus colors.

- [ ] **Step 2: Verify responsive UI**

Run the site locally and inspect dashboard at desktop and mobile widths.
Confirm icon center, title readability, focus-visible, hover, overflow and
reduced motion.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: centra e ingrandisce le icone app"
```

### Task 9: Complete verification and publication

**Files:**
- Review all changed files.

- [ ] **Step 1: Run complete checks**

```bash
npm test -- --run
npm run typecheck
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=build-only-key \
SUPABASE_SERVICE_ROLE_KEY=build-only-service-key \
RESEND_API_KEY=build-only-resend \
npm run build
git diff --check
```

Expected: all tests and build pass.

- [ ] **Step 2: Apply database migration**

Apply `20260730_create_access_log.sql` to the production Supabase project
before verifying login tracking.

- [ ] **Step 3: Manual production verification**

Verify:

- Team interno sees all active apps.
- Cliente sees only Sondaggio Prodotti Iconici by default.
- Assegna tutte and Escludi tutte update the dashboard.
- Two distinct users create login events and app-opening events.
- Report lists both users under **Accessi al workspace** and **Aperture delle app**.
- Card layout is correct desktop/mobile.

- [ ] **Step 4: Publish**

```bash
./scripts/pubblica.sh "fix assegnazioni utenti e reportistica accessi"
```

- [ ] **Step 5: Confirm Vercel and production**

Wait for Vercel success, then re-run the production checks. Do not claim
completion if the migration or report verification is incomplete.
