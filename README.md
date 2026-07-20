# True App

Piattaforma per ospitare le web app di True Design, con area utente e area admin.

## Setup locale

1. `npm install`
2. Copia `.env.local.example` in `.env.local` e inserisci le chiavi da Supabase (Project Settings → API)
3. `npm run dev`

## Deploy su Vercel

1. Importa il repository GitHub su Vercel
2. Aggiungi le stesse 3 variabili d'ambiente in Vercel (Project Settings → Environment Variables)
3. Collega il dominio truedesign.app in Project Settings → Domains

## Come funziona

- `/login` — accesso utenti
- `/dashboard` — area utente, mostra solo le app assegnate
- `/admin` — area admin (solo per utenti con `is_admin = true` nella tabella `profiles`)
  - `/admin/apps` — crea/gestisci le app disponibili
  - `/admin/assignments` — invita utenti e assegna loro le app
  - `/admin/usage` — log di utilizzo per app e per utente

## Rendere admin il primo utente

Dopo il primo login, in Supabase SQL Editor:

```sql
update profiles set is_admin = true where id = 'INSERISCI-QUI-IL-TUO-USER-ID';
```

L'ID si trova in Supabase → Authentication → Users.
