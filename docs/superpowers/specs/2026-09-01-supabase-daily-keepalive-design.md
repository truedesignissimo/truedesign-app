# Keep-alive giornaliero Supabase

## Obiettivo

Evitare la sospensione per inattività del progetto Supabase Free usato da
truedesign.app, senza introdurre servizi o piani a pagamento.

## Vincoli

- La soluzione deve restare completamente gratuita.
- Non deve modificare dati applicativi.
- L'endpoint non deve poter essere usato pubblicamente senza autorizzazione.
- Un fallimento del database deve produrre un errore osservabile nei log Vercel.

## Soluzione

Vercel esegue una volta al giorno una richiesta `GET` a
`/api/cron/supabase-keepalive`. La route confronta l'header `Authorization`
con `Bearer <CRON_SECRET>` e risponde `401` se il segreto manca o non coincide.

Quando la richiesta è valida, la route usa il client Supabase server-side ed
esegue una sola query di lettura minimale sulla tabella `apps`, limitata a una
riga. Non vengono effettuati inserimenti, aggiornamenti o cancellazioni.

La pianificazione è dichiarata in `vercel.json` alle 06:00 UTC ogni giorno.
Vercel Hobby può eseguire gratuitamente cron giornalieri; l'orario effettivo
può variare all'interno dell'ora, cosa irrilevante per questo caso.

## Risposte e diagnosi

- `200`: Supabase ha risposto alla query.
- `401`: richiesta non autorizzata o `CRON_SECRET` non configurato.
- `503`: Supabase non ha risposto correttamente; il messaggio pubblico non
  include dettagli sensibili, mentre il dettaglio viene scritto nei log.

## Configurazione

`CRON_SECRET` deve essere una stringa casuale di almeno 32 byte e deve essere
salvata negli environment variables Production di Vercel. Vercel la aggiunge
automaticamente come bearer token alle invocazioni del cron.

## Verifica

- Test unitari per autorizzazione, query riuscita e query fallita.
- Typecheck e build Next.js.
- Dopo il deploy: chiamata senza segreto deve restituire `401`; la cron deve
  risultare registrata nella dashboard Vercel e una chiamata autorizzata deve
  restituire `200`.

## Fuori ambito

Questa soluzione riduce fortemente il rischio di sospensione sul piano Free,
ma non costituisce una garanzia contrattuale di disponibilità e non aggiunge
backup automatici.
