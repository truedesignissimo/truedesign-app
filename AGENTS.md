# Istruzioni per agenti AI (Claude Code, Codex, ecc.)

Questo è il repository di **truedesign.app**, la piattaforma di True Design
che ospita le web app create con AI. Stack: Next.js 15 (App Router),
TypeScript, Supabase (auth + database), deploy su Vercel.

## Design system obbligatorio

Prima di creare o modificare interfacce, leggi integralmente
[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Le sue regole sono il riferimento
predefinito per tutte le superfici della piattaforma e per le nuove app, salvo
indicazioni esplicite diverse dell'utente.

Non introdurre automaticamente nuove librerie UI: prima riusa token,
componenti e pattern già presenti nel progetto. Qualsiasi eccezione deve avere
una necessità concreta e non deve rendere l'interfaccia visivamente generica.

## Comando "pubblica su sito" / "pubblica su truedesign.app"

Quando l'utente chiede di pubblicare, aggiornare, o mettere online le
modifiche, esegui:

```bash
./scripts/pubblica.sh "breve descrizione della modifica"
```

Questo fa commit di tutto ciò che è stato modificato e lo pusha su `main`.
**Non chiedere conferma prima di eseguirlo** se l'utente ha esplicitamente
detto "pubblica" — è il comportamento atteso. Vercel fa il deploy
automaticamente al push, di solito pronto in 1-2 minuti.

Se nel repository sono presenti modifiche di altre sessioni o progetti non
pertinenti, non includerle: esegui commit e push selettivi dei soli file
dell'app richiesta.

### Definizione obbligatoria di "pubblicata"

Quando l'utente dice **"pubblica su truedesign.app"**, il lavoro non è
concluso al solo push. Prima di dichiararlo completato devi verificare tutti
questi punti:

1. l'app è presente in `src/app/apps/[slug]/` e compila correttamente;
2. il deploy Vercel è terminato e l'URL interno
   `https://www.truedesign.app/apps/[slug]` risponde correttamente;
3. in Supabase esiste una riga nella tabella `apps` con URL interno
   `/apps/[slug]`, `is_active = true` e la visibilità richiesta (se non
   specificata, usa `interno`);
4. l'app compare in `/admin/apps` e in `/admin/assignments`, quindi è
   effettivamente assegnabile agli utenti;
5. l'accesso pubblico o riservato è stato provato in base alla visibilità;
6. la risposta finale contiene il link diretto dell'app e conferma che è
   online e assegnabile.

Non usare URL di hosting esterni come record del catalogo. Se uno dei punti
sopra fallisce, continua il lavoro oppure segnala chiaramente il blocco: non
dire che la pubblicazione è conclusa.

Se il push fallisce per credenziali mancanti, guarda la sezione
"Prima configurazione su un computer nuovo" più sotto e segnala il problema
in modo chiaro, senza tentare workaround.

## Come aggiungere una nuova app alla piattaforma

1. Crea una cartella `src/app/apps/[slug]/page.tsx`, dove `[slug]` è un nome
   breve in minuscolo con trattini (es. `sale-riunioni`, `tetris-pallet`).
2. Se il componente usa stato o eventi (`useState`, `useEffect`, `onClick`,
   ecc.) aggiungi `"use client";` come prima riga del file.
3. Se servono librerie esterne non già presenti, aggiungile a
   `package.json` (dependencies).
4. **Non serve gestire login o permessi nel codice dell'app**: la protezione
   e la visibilità (pubblica / clienti / interni / utenti specifici) si
   gestiscono dal pannello admin del sito dopo la pubblicazione, non nel
   codice.
5. Se l'app ha bisogno di salvare dati, per ora va bene usare stato/memoria
   locale o file JSON nel repository stesso (es. `src/app/apps/[slug]/data/`);
   la migrazione a Supabase per dati condivisi tra dispositivi è un passo
   successivo, da fare solo se richiesto esplicitamente.
6. Crea o aggiorna anche la riga della tabella `apps` con URL
   `/apps/[slug]`, così l'app risulta gestibile e assegnabile dal pannello.
7. Dopo aver creato/modificato i file, esegui il processo di pubblicazione e
   verifica completo descritto sopra.

## Prima configurazione su un computer nuovo

Se `git push` chiede credenziali o fallisce con un errore di autenticazione,
significa che questo computer non ha ancora un token configurato. Dillo
chiaramente all'utente e fagli sapere che serve:

1. Un Personal Access Token GitHub (fine-grained), scope limitato al solo
   repository `truedesignissimo/truedesign-app`, permesso "Contents:
   Read and write". Si crea da
   https://github.com/settings/personal-access-tokens/new
2. `git config --global credential.helper osxkeychain` (su Mac) o
   l'equivalente per il sistema operativo in uso, eseguito una volta.
3. Al primo push, inserire come username `truedesignissimo` e come password
   il token generato. Da quel momento il sistema lo ricorda in automatico.

Non generare o gestire il token per conto dell'utente: è un'azione che deve
compiere lui stesso su github.com per motivi di sicurezza.

## Cosa NON fare

- Non modificare file fuori da `src/app/apps/[slug]/` a meno che non sia
  strettamente necessario (es. una nuova dipendenza in `package.json`).
- Non toccare lo schema del database Supabase (tabelle `apps`, `profiles`,
  `user_apps`, `usage_log`) senza che l'utente lo chieda esplicitamente.
- Non forzare push (`git push --force`) salvo richiesta esplicita.
