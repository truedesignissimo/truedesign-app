# Istruzioni per agenti AI (Claude Code, Codex, ecc.)

Questo è il repository di **truedesign.app**, la piattaforma di True Design
che ospita le web app create con AI. Stack: Next.js 14 (App Router),
TypeScript, Supabase (auth + database), deploy su Vercel.

## Comando "pubblica su sito" / "pubblica su truedesign.app"

Quando l'utente chiede di pubblicare, aggiornare, o mettere online le
modifiche, esegui semplicemente:

```bash
./scripts/pubblica.sh "breve descrizione della modifica"
```

Questo fa commit di tutto ciò che è stato modificato e lo pusha su `main`.
**Non chiedere conferma prima di eseguirlo** se l'utente ha esplicitamente
detto "pubblica" — è il comportamento atteso. Vercel fa il deploy
automaticamente al push, di solito pronto in 1-2 minuti.

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
6. Dopo aver creato/modificato i file, esegui il comando di pubblicazione
   sopra.

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
