# Attivazione account via email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la password in registrazione con un'attivazione via email affidabile, recuperare le richieste pending duplicate e rendere osservabili gli errori di consegna.

**Architecture:** La server action delega la decisione create/recover/reject a un servizio puro testabile e usa un gateway Supabase per gli effetti. L'approvazione non conferma più l'email: genera invece un link Supabase monouso per `/imposta-password`, incluso nell'email True Design inviata da Resend.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase Admin/Auth, Resend, Vitest.

## Global Constraints

- Il form pubblico contiene soltanto nome, cognome ed email.
- Le richieste pending duplicate non creano nuove identità e reinviano la notifica.
- Gli account approvati non vengono modificati dal form pubblico.
- Nessun errore Resend deve essere ignorato silenziosamente.
- L'email viene verificata soltanto tramite il link personale dell'utente.
- Nessuna chiave server deve raggiungere il client o i log.

---

### Task 1: Servizio idempotente di richiesta registrazione

**Files:**
- Create: `src/lib/registration-request.ts`
- Create: `src/lib/registration-request.test.ts`
- Modify: `src/app/registrati/actions.ts`

**Interfaces:**
- Produces: `submitRegistrationRequest(input, gateway): Promise<RegistrationRequestResult>`
- `RegistrationRequestResult` distingue `created`, `recovered-pending`, `already-active` e `notification-failed`.

- [ ] **Step 1: Scrivere i test fallenti**

```ts
it("crea una nuova richiesta senza password scelta dall'utente", async () => {
  const result = await submitRegistrationRequest(validInput, gateway);
  expect(gateway.createPendingAccount).toHaveBeenCalledOnce();
  expect(result.status).toBe("created");
});

it("recupera un account pending e reinvia la notifica", async () => {
  gateway.findByEmail.mockResolvedValue({ id: "u1", status: "pending" });
  const result = await submitRegistrationRequest(validInput, gateway);
  expect(gateway.refreshPendingAccount).toHaveBeenCalledWith("u1", validInput);
  expect(gateway.notifyOwner).toHaveBeenCalledWith("u1", validInput);
  expect(result.status).toBe("recovered-pending");
});

it("non modifica un account già approvato", async () => {
  gateway.findByEmail.mockResolvedValue({ id: "u1", status: "approved" });
  const result = await submitRegistrationRequest(validInput, gateway);
  expect(result.status).toBe("already-active");
  expect(gateway.refreshPendingAccount).not.toHaveBeenCalled();
});

it("segnala il fallimento della notifica mantenendo la richiesta", async () => {
  gateway.notifyOwner.mockRejectedValue(new Error("mail"));
  const result = await submitRegistrationRequest(validInput, gateway);
  expect(result.status).toBe("notification-failed");
});
```

- [ ] **Step 2: Eseguire il test e verificare RED**

Run: `npm test -- src/lib/registration-request.test.ts`

Expected: FAIL perché `registration-request.ts` non esiste.

- [ ] **Step 3: Implementare il servizio minimo**

```ts
export type RegistrationRequestGateway = {
  findByEmail(email: string): Promise<{ id: string; status: "pending" | "approved" | "rejected" } | null>;
  createPendingAccount(input: RegistrationIdentity): Promise<string>;
  refreshPendingAccount(userId: string, input: RegistrationIdentity): Promise<void>;
  notifyOwner(userId: string, input: RegistrationIdentity): Promise<void>;
};
```

La server action genera una password casuale server-side con
`randomBytes(32).toString("base64url")`, cerca l'account Auth per email,
aggiorna o crea il profilo pending e mappa l'esito in un messaggio pubblico.

- [ ] **Step 4: Verificare GREEN**

Run: `npm test -- src/lib/registration-request.test.ts`

Expected: tutti i test del servizio PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/registration-request.ts src/lib/registration-request.test.ts src/app/registrati/actions.ts
git commit -m "fix: rende idempotenti le richieste di registrazione"
```

### Task 2: Link monouso per scegliere la password

**Files:**
- Modify: `src/lib/registration-approval.ts`
- Modify: `src/lib/registration-approval.test.ts`
- Modify: `src/lib/supabase-registration-approval.ts`
- Modify: `src/lib/registration-email.ts`
- Modify: `src/lib/registration-email.test.ts`
- Modify: `src/app/approva-utente/actions.ts`
- Modify: `src/app/admin/assignments/actions.ts`

**Interfaces:**
- `ApprovalGateway.createPasswordSetupUrl(userId, redirectTo): Promise<string>`
- `sendActivationEmail` riceve `activationUrl` oltre a nome, email e numero app.

- [ ] **Step 1: Scrivere test fallenti per l'opt-in**

```ts
it("genera il link password e non conferma l'email lato server", async () => {
  gateway.createPasswordSetupUrl.mockResolvedValue("https://supabase.test/recovery");
  await approvePendingRegistration(input);
  expect(gateway.createPasswordSetupUrl).toHaveBeenCalledOnce();
  expect(input.sendActivationEmail).toHaveBeenCalledWith(
    expect.objectContaining({ activationUrl: "https://supabase.test/recovery" })
  );
});

it("usa il link personale nel bottone dell'email", () => {
  const email = buildAccountActiveEmail({
    recipient: "utente@example.com",
    firstName: "Dario",
    appCount: 2,
    activationUrl: "https://example.com/activate",
  });
  expect(email.html).toContain("https://example.com/activate");
  expect(email.html).toContain("Scegli la password");
});
```

- [ ] **Step 2: Eseguire i test e verificare RED**

Run: `npm test -- src/lib/registration-approval.test.ts src/lib/registration-email.test.ts`

Expected: FAIL perché il gateway usa ancora `confirmEmail` e il template usa `loginUrl`.

- [ ] **Step 3: Implementare link Supabase monouso**

Il gateway chiama:

```ts
admin.auth.admin.generateLink({
  type: "recovery",
  email: account.email,
  options: { redirectTo: getAuthRedirect("/imposta-password") },
});
```

Usa `properties.action_link` come `activationUrl`. Rimuove
`updateUserById(... email_confirm: true)` dal flusso di approvazione.
Il reinvio amministrativo genera ogni volta un nuovo link.

- [ ] **Step 4: Verificare GREEN**

Run: `npm test -- src/lib/registration-approval.test.ts src/lib/registration-email.test.ts`

Expected: PASS e nessuna chiamata a conferma email.

- [ ] **Step 5: Commit**

```bash
git add src/lib/registration-approval.ts src/lib/registration-approval.test.ts src/lib/supabase-registration-approval.ts src/lib/registration-email.ts src/lib/registration-email.test.ts src/app/approva-utente/actions.ts src/app/admin/assignments/actions.ts
git commit -m "fix: attiva gli account tramite link password"
```

### Task 3: Form senza password e messaggi accurati

**Files:**
- Modify: `src/app/registrati/page.tsx`
- Create: `src/app/registrati/registration-page.test.ts`

**Interfaces:**
- Il client invia `{ firstName, lastName, email }`.
- Gli esiti `created` e `recovered-pending` mostrano la conferma.
- `already-active` propone accesso/recupero password.
- `notification-failed` comunica che la richiesta è salvata e può essere reinviata.

- [ ] **Step 1: Scrivere il test fallente**

```ts
it("non mostra né invia un campo password", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  expect(source).not.toContain('id="registration-password"');
  expect(source).not.toContain("password,");
});
```

- [ ] **Step 2: Verificare RED**

Run: `npm test -- src/app/registrati/registration-page.test.ts`

Expected: FAIL perché il campo password è ancora presente.

- [ ] **Step 3: Rimuovere password e aggiornare il copy**

Eliminare stato, input, validazione e invio della password. La conferma recita:
“Richiesta ricevuta. Dopo l’approvazione riceverai un link personale per
scegliere la password e attivare l’account.”

- [ ] **Step 4: Verificare GREEN**

Run: `npm test -- src/app/registrati/registration-page.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/registrati/page.tsx src/app/registrati/registration-page.test.ts
git commit -m "fix: sposta la scelta password dopo approvazione"
```

### Task 4: Diagnostica email, regressione e pubblicazione

**Files:**
- Modify: `.env.local.example`
- Modify: `src/lib/registration-email.ts`
- Modify: `src/lib/registration-email.test.ts`

**Interfaces:**
- `sendResendEmail` restituisce l'id Resend quando l'API risponde correttamente.
- Gli errori contengono solo stato HTTP e categoria, mai API key o HTML completo.

- [ ] **Step 1: Scrivere test fallenti sugli errori Resend**

```ts
it("restituisce l'id del messaggio", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ id: "email-1" }), { status: 200 })
  );
  await expect(sendResendEmail(message, config, fetcher)).resolves.toBe("email-1");
});

it("include lo stato HTTP nell'errore senza esporre la chiave", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
  await expect(sendResendEmail(message, config, fetcher)).rejects.toThrow("HTTP 403");
});
```

- [ ] **Step 2: Verificare RED**

Run: `npm test -- src/lib/registration-email.test.ts`

Expected: FAIL perché la funzione non restituisce l'id e usa un errore generico.

- [ ] **Step 3: Implementare diagnostica sicura**

Leggere `{ id }` dalla risposta Resend, validarlo e restituirlo. In caso negativo
generare `Invio email non riuscito (HTTP <status>).` senza serializzare risposta,
chiavi o contenuto del messaggio.

- [ ] **Step 4: Verifica completa**

Run:

```bash
npm test
npm run typecheck
npm audit --omit=dev
npm run build
```

Expected: test e typecheck PASS, audit con 0 vulnerabilità, build exit 0.

- [ ] **Step 5: Pubblicare e verificare**

Run:

```bash
./scripts/pubblica.sh "fix: completa attivazione account via email"
```

Verificare:

- `https://www.truedesign.app/registrati` non mostra la password;
- la stessa email pending può reinviare la richiesta;
- il pannello mostra un solo account;
- la notifica amministrativa arriva;
- l'approvazione invia l'email utente;
- il link apre `/imposta-password`;
- dopo la scelta password l'utente accede alle app assegnate.
