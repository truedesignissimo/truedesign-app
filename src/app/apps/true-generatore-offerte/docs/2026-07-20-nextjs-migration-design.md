# TRUE Generatore Offerte — Next.js Migration Design

## Obiettivo

Integrare TRUE Generatore Offerte V3 in `truedesign-app` alla rotta `/apps/true-generatore-offerte`, eliminando la dipendenza dal precedente hosting PHP. La nuova implementazione deve poter essere aggiornata direttamente nel repository e pubblicata automaticamente da Vercel dopo un push su `main`.

## Vincoli commerciali

- I PDF ufficiali restano la fonte assoluta per prodotti, codici, prezzi, finiture, colori, tessuti, varianti ed extra.
- La migrazione non deve reinterpretare o correggere silenziosamente dati commerciali.
- I dati derivati mantengono provenienza e stato di validazione già registrati nella V3.
- Un dato apparentemente mancante deve essere ricontrollato visivamente nel PDF prima di essere dichiarato assente.

## Ambito della prima pubblicazione

La versione Next.js include:

- selezione del listino ITA-ENG o FRA-ENG;
- ricerca e configurazione dei prodotti;
- quantità, varianti, finiture, colori, tessuti ed extra charges;
- calcoli commerciali, sconti e riepiloghi;
- dati cliente, progetto e validità dell'offerta;
- caricamento di un'immagine personalizzata per riga;
- anteprima e generazione PDF;
- salvataggio, elenco, apertura ed eliminazione delle offerte tramite Supabase.

La prima pubblicazione esclude:

- generazione immagini OpenAI;
- generazione immagini Gemini;
- proxy PHP e chiavi dei provider AI;
- archivio immagini generato automaticamente.

La logica AI esistente non viene eliminata dal progetto sorgente originale. Nel nuovo repository viene conservata una nota tecnica non eseguibile che descrive componenti, dipendenze e percorso di reintroduzione.

## Architettura applicativa

### Pagina e componenti

`page.tsx` è un server component leggero che verifica la sessione tramite il client Supabase già presente e passa l'identità utente al componente client. `offer-generator.tsx` coordina lo stato, mentre componenti focalizzati gestiscono testata, ricerca, configuratore, righe, totali, archivio e anteprima PDF.

La logica pura viene separata in moduli per tipi, calcolo prezzi, normalizzazione catalogo, serializzazione delle offerte e composizione del contenuto PDF. Nessun componente deve conoscere direttamente la struttura completa del catalogo sorgente.

### Catalogo

I cataloghi V3 attuali occupano circa 23 MB perché contengono disegni e fotografie Base64. La migrazione produce:

- un indice prodotto leggero per ricerca e configurazione;
- metadati commerciali completi, preservati senza reinterpretazione;
- immagini estratte come asset separati o riferimenti URL ufficiali;
- campioni tessuto separati dai record commerciali.

I file generati vengono pubblicati sotto `public/apps/true-generatore-offerte/`. Questa è un'eccezione strettamente necessaria alla regola della singola cartella: i cataloghi da 8–11 MB superano la dimensione adatta a una risposta serverless e non devono gonfiare il bundle JavaScript. La conversione deve essere deterministica e verificata confrontando codici, prezzi, opzioni ed extra con l'output V3 di partenza.

### Persistenza Supabase

La tabella `commercial_offers` contiene:

- `id uuid`;
- `user_id uuid` collegato ad `auth.users`;
- `offer_number text`;
- `customer_name text`;
- `project_reference text`;
- `payload jsonb` con lo stato completo dell'offerta;
- `created_at` e `updated_at`.

Le policy RLS consentono a ogni utente di leggere e modificare soltanto le proprie offerte. Gli amministratori della piattaforma non ricevono implicitamente accesso ai contenuti commerciali: un'eventuale policy amministrativa richiederà una decisione separata.

Il bucket privato `commercial-offer-images` contiene le immagini nel percorso `<user-id>/<offer-id>/<line-id>/<filename>`. Le policy Storage applicano lo stesso isolamento per utente. Il client usa URL firmati temporanei per anteprima e PDF.

### PDF

`jspdf` viene installato come dipendenza npm. La composizione PDF mantiene il comportamento V3 già verificato:

- logo ridimensionato;
- testata entro i margini;
- descrizioni compatte;
- immagini con proporzioni preservate;
- immagine personalizzata prioritaria rispetto a quella di catalogo;
- anteprima obbligatoria prima del download.

## Autenticazione e routing

Il repository corrente protegge soltanto `/dashboard` e `/admin`; non esiste ancora un layout `/apps`. La migrazione aggiunge la protezione `/apps/:path*` al middleware e un layout applicativo condiviso. Il generatore non implementa login o permessi propri.

## Dashboard

La scheda Supabase usa:

- nome: `TRUE Generatore Offerte`;
- URL: `/apps/true-generatore-offerte`;
- descrizione: `Generatore di offerte commerciali TRUE Design con configurazione prodotti, listini, finiture, tessuti, immagini personalizzate e PDF.`

La creazione del record nella tabella `apps` è una configurazione di rilascio, non logica del componente.

## Errori e resilienza

- Un errore Supabase lascia lo stato corrente nell'interfaccia e mostra un messaggio recuperabile.
- Un upload fallito non elimina l'immagine precedente.
- Un catalogo non valido blocca l'avvio con un errore esplicito, senza mostrare prezzi parziali.
- La generazione PDF segnala asset non caricabili e mantiene il layout senza deformazioni.
- Il salvataggio usa aggiornamenti espliciti e non sovrascrive offerte appartenenti ad altri utenti.

## Verifica

La consegna richiede:

- test del trasformatore catalogo contro l'output V3;
- controlli su codici, prezzi, finiture, tessuti, varianti ed extra;
- test delle funzioni di calcolo e serializzazione;
- typecheck e build Next.js;
- verifica RLS e Storage con due utenti distinti;
- smoke test desktop e mobile;
- creazione, salvataggio, riapertura e PDF di un'offerta con immagine personalizzata;
- conferma che nessun controllo o endpoint di generazione AI sia raggiungibile.

## Aggiornamenti futuri

Dopo la migrazione, la versione Next.js è la sorgente runtime principale. Le correzioni commerciali vengono applicate ai dati sorgente verificati e rigenerate con il trasformatore del catalogo; UI e comportamento vengono modificati direttamente nei componenti React. Ogni push su `main` attiva il deploy Vercel.
