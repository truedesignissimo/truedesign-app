# True Tetris Pallet: archivio cloud dei piani di spedizione

## Obiettivo

Conservare in un archivio condiviso tutti i piani di spedizione generati da True Tetris Pallet, così che qualsiasi utente autorizzato all’app possa riaprirli, duplicarli, modificarli o eliminarli. Il file XLS/CSV importato è un allegato facoltativo del piano, utile per ricostruire e verificare casi logistici specifici.

## Priorità e ambito

1. Il dato principale è il piano generato: ordine, righe interpretate, pallet scelti, limiti, scatole, posizioni e modifiche manuali.
2. Il file XLS/CSV sorgente viene archiviato quando disponibile, ma un piano resta riapribile anche senza file.
3. Tutti gli utenti che hanno accesso a True Tetris Pallet possono vedere, aprire e cancellare ogni elemento dell’archivio.
4. Non esiste una scadenza automatica.

## Architettura

La pagina Next.js della rotta `/apps/true-tetris-pallet` resta responsabile della sessione Supabase e aggiunge un bridge `postMessage` verso il configuratore già esistente dentro l’iframe `srcDoc`.

L’iframe mantiene il motore 3D e l’interfaccia attuali. Quando deve leggere, salvare, duplicare, eliminare o recuperare un allegato, invia una richiesta strutturata al parent. Il parent usa il client Supabase autenticato e rimanda una risposta correlata all’iframe. Questo evita di esporre credenziali, mantiene il configuratore auto-contenuto e non richiede di riscrivere il motore di palletizzazione in React.

## Dati cloud

Tabella `tetris_pallet_shipments`:

- `id uuid primary key`
- `created_at`, `updated_at timestamptz`
- `created_by uuid`
- `title text`
- `order_number`, `order_series`, `customer`, `order_date`, `destination text`
- `source_file_name`, `source_file_path`, `source_file_type`, `source_file_size`
- `order_rows jsonb`
- `settings jsonb` (pallet selezionati e altezza massima)
- `plan jsonb` (pallet, scatole, posizioni e modifiche)
- `summary jsonb` (numero pallet, colli, peso e cubaggio)

Bucket privato `true-tetris-pallet-orders`:

- percorso: `<shipment-id>/source.<estensione>`
- contiene solo XLSX o CSV effettivamente importati dall’ordine.

## Accessi e sicurezza

RLS è attivo sia sulla tabella sia sul bucket. Un utente autenticato può operare solo se è amministratore oppure se ha l’app con URL `/apps/true-tetris-pallet` assegnata nella tabella `user_apps`. Per gli utenti ammessi, le policy permettono lettura, inserimento, aggiornamento e cancellazione su tutti i piani e allegati: l’archivio è intenzionalmente condiviso.

## Esperienza nell’app

Il bottone esistente `Archivio` diventa l’archivio cloud dei piani.

- Griglia ordinata dal più recente.
- Ogni scheda mostra cliente, riferimento ordine, data, autore, pallet, colli, peso e ultimo aggiornamento.
- Ricerca per cliente, riferimento ordine e nome file.
- `Apri e modifica` ripristina esattamente il piano, compresa la disposizione manuale.
- `Duplica` crea una copia cloud modificabile.
- `Scarica XLS/CSV` compare solo se è presente un allegato.
- `Elimina` richiede una conferma esplicita e rimuove piano e allegato.

Al primo calcolo riuscito viene creato automaticamente un piano cloud; dopo ogni modifica valida viene aggiornato lo stesso piano. Il bottone `Salva spedizione` conserva la funzione di salvataggio esplicito e conferma a video il completamento.

## Errori e continuità

- Se il salvataggio cloud fallisce, il piano continua a funzionare localmente e viene mostrato un messaggio con `Riprova`.
- Un errore nell’upload dell’XLS non annulla il piano: il piano viene salvato senza allegato, con avviso.
- Se l’utente apre un record senza allegato, vengono ripristinati i dati serializzati del piano.
- L’eliminazione si ferma e segnala l’errore se non può rimuovere sia record sia file; nessun elemento viene nascosto dall’interfaccia prima della risposta del server.

## Verifica

- Test unitari per serializzazione e ricostruzione del piano.
- Test del bridge per list/save/open/delete e gestione degli errori.
- Collaudo con un XLS reale: calcolo, modifica manuale, ricarica da archivio e download dell’originale.
- Verifica RLS con un utente assegnato all’app e uno senza assegnazione.

## Prerequisito esterno

La migrazione SQL crea tabella, bucket e policy nel progetto Supabase `True App`. Il repository conterrà la migrazione pronta; l’esecuzione richiede l’accesso amministrativo al progetto Supabase, che non è disponibile nel checkout locale.
