# Condivisione prenotazioni sale riunioni — Design

## Obiettivo

Le prenotazioni delle sale riunioni devono essere condivise tra tutti gli utenti a cui l'app `prenotazione-sale-riunioni` è assegnata e aggiornarsi senza ricaricare la pagina.

## Soluzione scelta

La persistenza locale viene sostituita da una tabella Supabase `room_bookings`. La pagina legge e scrive la tabella tramite il client browser già usato dalle altre app; un canale Realtime ricarica l'elenco quando una prenotazione viene creata, modificata o eliminata da un altro utente.

La tabella conserva l'autore (`created_by`), il nome visibile, sala, data, orario, durata e note. Un vincolo di esclusione PostgreSQL impedisce sovrapposizioni della stessa sala anche quando due utenti confermano contemporaneamente.

## Accesso e gestione

- Solo un amministratore o un utente con l'app assegnata può leggere o creare prenotazioni.
- Tutti gli utenti autorizzati vedono tutte le prenotazioni.
- L'autore può modificare o eliminare le proprie prenotazioni; un amministratore può gestire qualsiasi prenotazione.
- Le policy RLS applicano queste regole nel database, senza affidarsi alla sola interfaccia.

## Esperienza utente

La struttura e le foto esistenti restano invariate. La lista mostrerà lo stato di caricamento e gli aggiornamenti live; le azioni di modifica ed eliminazione appaiono solo dove consentito. Gli errori di permesso e conflitto diventano messaggi inline comprensibili. Le prenotazioni precedenti contenute nel solo browser non vengono importate automaticamente, per evitare di condividere dati senza conferma dell'autore.

## Verifica

Test automatici coprono il contratto della migrazione, il repository Supabase e il comportamento della pagina. La pubblicazione verifica build, deploy, URL protetto e record dell'app nel catalogo.
