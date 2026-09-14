# Condivisione prenotazioni sale riunioni Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere le prenotazioni delle sale condivise in tempo reale tra gli utenti autorizzati dell'app.

**Architecture:** Una migrazione crea `room_bookings`, una funzione RLS basata su assegnazione e un vincolo PostgreSQL anti-sovrapposizione. Un repository trasforma i record Supabase nel modello dell'interfaccia; la pagina lo usa per caricamento, mutazioni e canale Realtime.

**Tech Stack:** Next.js 15, TypeScript, Supabase JS, PostgreSQL RLS e Supabase Realtime, Vitest.

## Global Constraints

- Non aggiungere dipendenze UI o di runtime.
- Mantieni l'accesso dell'app gestito da `apps` e `user_apps`.
- Tutti gli utenti autorizzati leggono le prenotazioni; autore e amministratore sono gli unici a modificarle o eliminarle.
- I conflitti di orario devono essere bloccati nel database, non soltanto nel browser.

---

### Task 1: Persistenza e autorizzazione Supabase

**Files:**

- Create: `supabase/migrations/20260914_create_room_bookings.sql`
- Test: `src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.test.ts`

**Interfaces:** Produce tabella `public.room_bookings` e funzione `public.room_bookings_allowed()`.

- [ ] Step 1: scrivere un test che cerchi la tabella, l'URL `/apps/prenotazione-sale-riunioni` e `exclude using gist` nella migrazione.
- [ ] Step 2: eseguire `npm test -- src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.test.ts` e verificare il fallimento perché la migrazione manca.
- [ ] Step 3: creare la migrazione con schema, RLS, policy select condivisa, policy insert, policy update/delete autore-o-admin, vincolo GiST su sala/data/fascia oraria e pubblicazione Realtime.
- [ ] Step 4: rieseguire il test mirato e verificarne il successo.
- [ ] Step 5: eseguire `git add supabase/migrations/20260914_create_room_bookings.sql src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.test.ts` e `git commit -m "feat: aggiunge prenotazioni sale condivise"`.

### Task 2: Repository condiviso e pagina Realtime

**Files:**

- Create: `src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.ts`
- Modify: `src/app/apps/prenotazione-sale-riunioni/page.tsx`
- Modify: `src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.test.ts`

**Interfaces:** `createRoomBookingsRepository(supabase)` espone `list`, `create`, `update`, `remove`; `RoomBooking` usa `id: string` e `createdBy: string`.

- [ ] Step 1: scrivere il test che invoca `repository.list()` e verifica l'uso della tabella `room_bookings`.
- [ ] Step 2: eseguire il test mirato e verificare il fallimento perché il repository non esiste.
- [ ] Step 3: implementare il repository, sostituire `localStorage` nella pagina, sottoscrivere `postgres_changes` della tabella e limitare i controlli di gestione alle prenotazioni autorizzate.
- [ ] Step 4: rieseguire il test mirato e verificarne il successo.
- [ ] Step 5: eseguire `git add src/app/apps/prenotazione-sale-riunioni/page.tsx src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.ts src/app/apps/prenotazione-sale-riunioni/data/room-bookings-repository.test.ts` e `git commit -m "feat: sincronizza prenotazioni sale in tempo reale"`.

### Task 3: Verifica e pubblicazione

**Files:** Verify `src/app/apps/prenotazione-sale-riunioni/page.test.ts`.

- [ ] Step 1: eseguire `npm test -- src/app/apps/prenotazione-sale-riunioni` e verificare successo.
- [ ] Step 2: eseguire `npm test` e verificare zero fallimenti.
- [ ] Step 3: eseguire `npm run build` e verificare exit code 0.
- [ ] Step 4: pubblicare soltanto i file della funzione con `./scripts/pubblica.sh "Sincronizza le prenotazioni delle sale in tempo reale"`.
- [ ] Step 5: verificare URL pubblicato, record catalogo attivo e presenza in `/admin/apps` e `/admin/assignments`.
