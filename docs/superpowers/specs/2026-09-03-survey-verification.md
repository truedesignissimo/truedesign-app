# Sondaggio: verifica del 3 settembre 2026

## Unica linea di lavoro

La sessione principale usa `codex/sondaggio-multilingua`, allineata a `origin/main` a541bc0 prima delle modifiche. L'altra attività era ferma e non aveva modificato codice o dati. Il vecchio lavoro di automazione è conservato separatamente; nessun branch è stato cancellato. Le modifiche non pertinenti al Generatore Offerte restano escluse dalla pubblicazione.

## Funzionalità

- Italiano, inglese e francese con bandiere e nomi delle lingue; preferenza locale e parametro URL `lang`.
- Nome e dieci scelte restano invariati cambiando lingua. Testi, errori e conferma a schermo tradotti; nomi commerciali dei prodotti invariati.
- Contatore temporaneo sulla scheda, blocco dell'undicesima scelta e blocco dei controlli durante invio. Rispetto di `prefers-reduced-motion`.
- Eliminazione della singola risposta corrente con conferma esplicita, controllo admin lato server e cancellazione di un solo UUID. Gli archivi non vengono alterati da questa operazione.
- Migrazione autonoma `20260903110000_survey_archive_concurrency.sql`: crea strutture mancanti, serializza reset/ripristino/eliminazione archivio mediante lock coerenti e limita gli RPC a `service_role`.

## Verifiche effettivamente eseguite

- 235 test in 56 file passati; typecheck passato.
- Revisione indipendente: nessun problema critico/importante; corretta una nota minore sull'annuncio accessibile della decima scelta.
- Browser su build di produzione e database simulato locale: cambio lingua, persistenza, mantenimento nome/scelte, limite dieci, errore temporaneo in francese, nuovo invio riuscito, conferma nelle tre lingue, focus da tastiera, schermo 390×844 senza overflow.
- SQL su schema isolato con soli dati sintetici: doppia applicazione migrazione, reset, ripristino su vuoto, snapshot di sicurezza, ripristino ripetuto senza duplicati, errore forzato a metà reset/ripristino con rollback, conteggi incoerenti rifiutati, cancellazione archivio circoscritta, privilegi RPC. Tutto passato; `ROLLBACK` e successivo controllo confermano schema temporaneo assente.
- Migrazione applicata via SQL Editor al progetto Supabase `qdiowupgrkkwhkgsbhqz`. Nessun reset, ripristino o cancellazione eseguito sulle risposte reali.
- Prima/dopo: 11 risposte, impronta identica `3f2c13e4a3e2e49f371239944902d83d`. Archivio inizialmente assente, ora presente e vuoto. `anon` e `authenticated` non possono eseguire reset; `service_role` sì.

## Limiti dichiarati

- Non sono state inviate email dal sondaggio: il flusso esistente non raccoglie email e non ne invia. Non sono stati aggiunti invii né cambiate le email di registrazione della piattaforma.
- Non è stato eseguito un reset dei voti reali per collaudo. L'invariante di concorrenza è coperto da revisione dei lock e test strutturali; non è stato simulato un carico concorrente a due connessioni sul database di produzione.
- Nessuna nuova libreria, piano a pagamento o servizio esterno aggiunto.

Pubblicazione e riscontro live da completare dopo il push selettivo.
