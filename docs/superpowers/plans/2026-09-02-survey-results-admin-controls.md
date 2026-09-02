# Survey Results Admin Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare il sondaggio a dieci scelte e dotare la dashboard amministrativa di partecipanti in evidenza, esportazione Excel e archivi ripristinabili/eliminabili.

**Architecture:** Le letture restano server-side. Le mutazioni archivio/azzera/ripristina/elimina passano da server action autorizzate e funzioni SQL atomiche accessibili solo alla service role. Un generatore Excel server-only riusa funzioni pure di riepilogo e ranking per dataset corrente e archiviato.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase/PostgreSQL, Vitest, ExcelJS (MIT, server-only), CSS globale esistente.

## Global Constraints

- Ogni nuova risposta richiede esattamente 10 prodotti; le risposte storiche da 5 restano leggibili.
- Solo gli amministratori possono leggere archivi, esportare, azzerare, ripristinare o eliminare.
- L'azzeramento archivia e cancella nella stessa transazione.
- Il ripristino archivia prima eventuali risultati correnti e poi sostituisce il dataset.
- L'eliminazione archivio è definitiva e richiede conferma esplicita.
- Il file `.xlsx` contiene `Riepilogo`, `Classifica` e `Risposte` e neutralizza formula injection.
- Nessun dato sensibile o errore database grezzo raggiunge il browser.
- UI coerente con `DESIGN_SYSTEM.md`, accessibile da tastiera e responsive.

---

### Task 1: Dieci selezioni nel sondaggio

**Files:**
- Modify: `src/app/apps/true-sondaggio-iconici/api/validation.test.ts`
- Modify: `src/app/apps/true-sondaggio-iconici/api/validation.ts`
- Modify: `src/app/apps/true-sondaggio-iconici/survey.tsx`

**Interfaces:**
- Produces: `SURVEY_SELECTION_COUNT = 10` esportata dalla validazione e riusata dalla UI.

- [ ] **Step 1: Scrivere il test rosso**

Aggiornare il test affinché costruisca 10 scelte valide, accetti 10 e rifiuti 9 e 11:

```ts
it("requires exactly ten valid choices and links", () => {
  const choices = Array.from({ length: 10 }, (_, index) => `${index + 1}. Prodotto ${index + 1}`);
  const links = choices.map((_, index) => `https://www.truedesign.it/it/prodotti/prodotto-${index}/`);
  expect(isValidSurveySubmission("Mario Rossi", choices, links)).toBe(true);
  expect(isValidSurveySubmission("Mario Rossi", choices.slice(0, 9), links.slice(0, 9))).toBe(false);
  expect(isValidSurveySubmission("Mario Rossi", [...choices, "11. Extra"], [...links, links[0]])).toBe(false);
});
```

- [ ] **Step 2: Verificare RED**

Run: `npm test -- src/app/apps/true-sondaggio-iconici/api/validation.test.ts`

Expected: FAIL perché la validazione accetta ancora cinque scelte.

- [ ] **Step 3: Implementare il minimo**

```ts
export const SURVEY_SELECTION_COUNT = 10;
// usare la costante per choices.length e links.length
```

Importare la costante in `survey.tsx`, sostituire `MAX_SELECTIONS`, “cinque” con “dieci” e il messaggio finale con “Le tue dieci scelte…”.

- [ ] **Step 4: Verificare GREEN e commit**

Run: `npm test -- src/app/apps/true-sondaggio-iconici/api/validation.test.ts`

Expected: PASS.

Commit: `feat: porta il sondaggio a dieci scelte`

---

### Task 2: Modello report, partecipanti e dati Excel

**Files:**
- Modify: `src/app/admin/apps/true-sondaggio-iconici/survey-results.test.ts`
- Modify: `src/app/admin/apps/true-sondaggio-iconici/survey-results.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/excel-data.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/excel-data.test.ts`

**Interfaces:**
- Produces: `buildSurveySummary(responses)`, `listSurveyParticipants(responses)`, `buildSurveyWorkbookData(responses)` e `escapeSpreadsheetCell(value)`.
- Consumes: `normalizeSurveyChoices`, `rankSurveyProducts`, `SurveyResponse`.

- [ ] **Step 1: Scrivere test rossi per ordine e riepilogo**

```ts
expect(listSurveyParticipants(responses).map((item) => item.name)).toEqual(["Lina", "Ada"]);
expect(buildSurveySummary(responses)).toMatchObject({ responses: 2, preferences: 3, products: 3 });
```

- [ ] **Step 2: Verificare RED**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/survey-results.test.ts`

Expected: FAIL perché le funzioni non esistono.

- [ ] **Step 3: Implementare funzioni pure**

`listSurveyParticipants` ordina per `submitted_at` discendente senza deduplicare. `buildSurveySummary` conta risposte, preferenze, prodotti distinti, prima e ultima data.

- [ ] **Step 4: Scrivere test rosso per Excel e formula injection**

```ts
expect(escapeSpreadsheetCell("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
expect(buildSurveyWorkbookData(responses).responses[0]).toEqual({
  submittedAt: "2026-07-20T13:00:00Z",
  participant: "Lina",
  choices: "Blade, Cloud",
});
```

- [ ] **Step 5: Implementare e verificare GREEN**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/survey-results.test.ts src/app/admin/apps/true-sondaggio-iconici/excel-data.test.ts`

Expected: PASS.

Commit: `feat: prepara report e dati excel sondaggio`

---

### Task 3: Archivio Supabase atomico

**Files:**
- Create: `supabase/migrations/20260902_survey_iconic_archives.sql`
- Create: `src/app/admin/apps/true-sondaggio-iconici/archive-service.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/archive-service.test.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/actions.ts`

**Interfaces:**
- Produces SQL RPC: `archive_and_reset_iconic_survey(actor uuid)`, `restore_iconic_survey_archive(target_archive uuid, actor uuid)`, `delete_iconic_survey_archive(target_archive uuid)`.
- Produces actions: `archiveAndResetSurvey(confirmation)`, `restoreSurveyArchive(archiveId, confirmation)`, `deleteSurveyArchive(archiveId, confirmation)`.

- [ ] **Step 1: Scrivere test rosso del servizio**

Con un gateway finto verificare che:

```ts
await expect(runArchiveAndReset("NO", gateway)).resolves.toEqual({ ok: false, error: "Scrivi AZZERA per confermare." });
await expect(runArchiveAndReset("AZZERA", gateway)).resolves.toEqual({ ok: true, archiveId: "archive-1", count: 2 });
expect(gateway.archiveAndReset).toHaveBeenCalledTimes(1);
```

Test analoghi verificano identificativo UUID, conferma `RIPRISTINA` e `ELIMINA`.

- [ ] **Step 2: Verificare RED e implementare il servizio**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/archive-service.test.ts`

Expected RED per modulo mancante, poi PASS dopo implementazione.

- [ ] **Step 3: Creare migrazione transazionale**

Creare tabelle, indici, RLS senza policy pubbliche e le tre funzioni `security definer` con `set search_path = public`. Revocare execute da `public`, `anon`, `authenticated` e concederlo solo a `service_role`.

`archive_and_reset_iconic_survey` deve inserire il parent, copiare le righe e cancellare `survey_iconic_responses` nello stesso corpo funzione. `restore_iconic_survey_archive` archivia il corrente se non vuoto, svuota il live e ricopia l'archivio con nuovi UUID. `delete_iconic_survey_archive` cancella il parent e sfrutta `on delete cascade`.

- [ ] **Step 4: Collegare server action autorizzate**

Ogni action chiama `createClient().auth.getUser()`, verifica `profiles.is_admin` tramite `createAdminClient()`, invoca il servizio/RPC e `revalidatePath("/admin/apps/true-sondaggio-iconici")`.

- [ ] **Step 5: Verificare e commit**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/archive-service.test.ts`

Commit: `feat: archivia e ripristina risultati sondaggio`

---

### Task 4: Generazione e download Excel amministrativo

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/app/admin/apps/true-sondaggio-iconici/workbook.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/workbook.test.ts`
- Create: `src/app/admin/apps/true-sondaggio-iconici/export/route.ts`

**Interfaces:**
- Consumes: `buildSurveyWorkbookData(responses)`.
- Produces: `createSurveyWorkbook(responses): Promise<Buffer>` e `GET(request)` per dataset live o `?archive=<uuid>`.

- [ ] **Step 1: Installare dipendenza necessaria**

Run: `npm install exceljs`

ExcelJS è MIT e viene importato solo dal codice server.

- [ ] **Step 2: Scrivere test rosso workbook**

Caricare il buffer generato con ExcelJS e verificare nomi fogli, intestazioni, conteggi e valore neutralizzato.

- [ ] **Step 3: Verificare RED e implementare workbook**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/workbook.test.ts`

Expected RED per modulo mancante, poi PASS con tre fogli `Riepilogo`, `Classifica`, `Risposte`.

- [ ] **Step 4: Implementare route protetta**

La route verifica sessione e profilo admin, valida l'UUID archivio, carica l'intero dataset ordinato e restituisce:

```ts
new Response(new Uint8Array(buffer), {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  },
});
```

- [ ] **Step 5: Verificare e commit**

Run: `npm test -- src/app/admin/apps/true-sondaggio-iconici/workbook.test.ts`

Commit: `feat: esporta risultati sondaggio in excel`

---

### Task 5: Dashboard, dialog e archivio

**Files:**
- Modify: `src/app/admin/apps/true-sondaggio-iconici/page.tsx`
- Create: `src/app/admin/apps/true-sondaggio-iconici/survey-admin-actions.tsx`
- Create: `src/app/admin/apps/true-sondaggio-iconici/archive-list.tsx`
- Create: `src/app/admin/apps/true-sondaggio-iconici/archive/[archiveId]/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes server actions del Task 3 e route export del Task 4.
- Produces dashboard ordinata: KPI → partecipanti → classifica → risposte → archivi.

- [ ] **Step 1: Estrarre dati pagina**

Caricare in parallelo risposte correnti e `survey_iconic_archives`; usare `listSurveyParticipants` e `buildSurveySummary`.

- [ ] **Step 2: Inserire partecipanti prima della classifica**

Renderizzare nome e data in una lista compatta con intestazione e conteggio. Mantenere ordine discendente e stato vuoto.

- [ ] **Step 3: Implementare comandi e dialog accessibili**

Il componente client usa `<dialog>`, chiude su Escape e click backdrop, conserva focus, disabilita durante pending e mostra feedback `aria-live`. Richiede `AZZERA`, `RIPRISTINA` o `ELIMINA` esatti.

- [ ] **Step 4: Implementare lista e dettaglio archivi**

Ogni riga espone Consulta, Scarica Excel, Ripristina, Elimina. La pagina `[archiveId]` valida UUID, carica righe archiviate e riusa riepilogo, partecipanti, classifica e dettaglio.

- [ ] **Step 5: Stile e controllo responsive**

Aggiungere classi `.survey-participant-list`, `.survey-admin-actions`, `.survey-archive-list`, `.survey-confirm-dialog` con token e colori esistenti; breakpoint mobile senza overflow; focus-visible e area minima 44px.

- [ ] **Step 6: Verificare e commit**

Run: `npm run typecheck && npm test`

Commit: `feat: completa gestione risultati sondaggio`

---

### Task 6: Verifica, migrazione e pubblicazione

**Files:**
- Verify all changed files.

**Interfaces:**
- Produces: funzionalità live su `https://www.truedesign.app/admin/apps/true-sondaggio-iconici`.

- [ ] **Step 1: Verifiche automatiche complete**

Run:

```bash
npm audit
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: exit 0; nessuna vulnerabilità introdotta; tutti i test passano.

- [ ] **Step 2: Applicare migrazione Supabase**

Applicare `20260902_survey_iconic_archives.sql` al progetto reale e verificare tabelle/RPC senza esporre credenziali.

- [ ] **Step 3: Pubblicare selettivamente**

Integrare i commit isolati su `main`, pushare senza includere modifiche di altre sessioni e attendere Vercel Ready.

- [ ] **Step 4: Verifica manuale produzione**

Controllare da amministratore desktop e mobile: dieci selezioni, partecipanti prima della classifica, `.xlsx` apribile, azzeramento atomico, archivio consultabile, ripristino, eliminazione definitiva e accesso negato a utente normale.

- [ ] **Step 5: Handoff**

Comunicare URL live, commit, conteggio test e risultato di ogni verifica; non dichiarare completato se migrazione o test produzione falliscono.
