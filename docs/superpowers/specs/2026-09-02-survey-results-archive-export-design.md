# Dashboard risultati Sondaggio Prodotti Iconici

## Obiettivo

Estendere il Sondaggio Prodotti Iconici e la pagina amministrativa `/admin/apps/true-sondaggio-iconici` con quattro capacità:

1. richiedere a ogni nuovo partecipante di scegliere esattamente 10 prodotti, invece di 5;
2. mostrare subito le persone che hanno partecipato, prima della classifica;
3. esportare i risultati correnti o archiviati in un file Excel `.xlsx`;
4. azzerare i risultati correnti senza perderli, creando prima un archivio datato che possa essere consultato, esportato, ripristinato o eliminato definitivamente.

Tutte le superfici e tutte le operazioni restano accessibili esclusivamente agli amministratori già autorizzati dal layout `/admin`.

## Selezione dei prodotti

Il catalogo dei prodotti disponibili rimane quello completo già caricato dal progetto originale. Cambia il numero di preferenze richieste per completare una nuova risposta:

- il partecipante deve selezionare **esattamente 10 prodotti**;
- contatore, istruzioni, stato disabled delle schede e messaggio finale mostrano il nuovo limite;
- la validazione server accetta solo 10 scelte e 10 URL True Design validi;
- le risposte storiche già registrate con 5 preferenze restano valide, visibili, archiviabili ed esportabili senza essere modificate.

## Esperienza amministratore

### Ordine dei contenuti

La pagina mantiene introduzione e KPI esistenti, quindi presenta i contenuti in questo ordine:

1. **Persone che hanno votato** — elenco compatto con nome, data e ora della risposta. Il numero dei partecipanti è visibile nell'intestazione della sezione. Le risposte restano ordinate dalla più recente.
2. **Classifica** — classifica dei prodotti e percentuale dei partecipanti che li ha scelti.
3. **Risposte individuali** — dettaglio completo già presente.
4. **Archivio rilevazioni** — elenco degli azzeramenti precedenti.

Il nome del partecipante viene mostrato esattamente come salvato nel sondaggio. Non viene deduplicato: due invii distinti restano due partecipazioni distinte, coerentemente con i conteggi attuali.

### Azioni principali

Nell'introduzione compaiono due azioni:

- **Scarica Excel**, disponibile quando esiste almeno una risposta corrente;
- **Azzera risultati**, azione distruttiva secondaria, disponibile quando esiste almeno una risposta corrente.

L'azzeramento apre un dialog accessibile. Per confermare l'amministratore deve digitare `AZZERA`. Durante l'operazione i comandi sono disabilitati. Il sistema crea lo snapshot e cancella i risultati correnti in un'unica transazione database: se l'archiviazione fallisce, nessuna risposta viene eliminata.

Il feedback di riuscita o errore è inline e accessibile, non un popup di sistema.

### Archivio rilevazioni

Ogni archivio mostra:

- data e ora di creazione;
- amministratore che ha eseguito l'azzeramento, quando disponibile;
- numero di risposte e preferenze;
- intervallo temporale della rilevazione;
- azioni **Consulta**, **Scarica Excel**, **Ripristina** ed **Elimina definitivamente**.

`Consulta` apre il dettaglio dell'archivio con partecipanti, classifica e risposte. `Ripristina` sostituisce il set corrente con quello archiviato: se nel frattempo esistono nuove risposte, queste vengono prima salvate automaticamente in un nuovo archivio, così non si perdono dati. L'archivio ripristinato rimane disponibile e viene marcato con la data dell'ultimo ripristino, evitando ripristini accidentali non tracciati.

`Elimina definitivamente` richiede una seconda conferma esplicita e rimuove archivio e righe associate. Dopo questa operazione i dati non sono recuperabili dall'interfaccia.

## Esportazione Excel

Il file `.xlsx` viene generato lato server e non contiene formule eseguibili provenienti dai dati inseriti dagli utenti. Il nome segue il formato:

`sondaggio-prodotti-iconici-YYYY-MM-DD-HHmm.xlsx`

Contiene tre fogli:

1. **Riepilogo** — totale risposte, totale preferenze, prodotti votati, prima e ultima risposta;
2. **Classifica** — posizione, prodotto, voti e percentuale dei partecipanti;
3. **Risposte** — data e ora, partecipante e prodotti scelti.

Lo stesso generatore viene riusato per risultati correnti e archiviati, in modo che il formato rimanga identico.

## Modello dati

Si aggiungono due tabelle Supabase:

### `survey_iconic_archives`

- `id uuid` chiave primaria;
- `archived_at timestamptz`;
- `archived_by uuid` nullable, collegato a `auth.users`;
- `response_count integer`;
- `preference_count integer`;
- `first_response_at timestamptz` nullable;
- `last_response_at timestamptz` nullable;
- `restored_at timestamptz` nullable;
- `restored_by uuid` nullable.

### `survey_iconic_archive_responses`

- `id uuid` chiave primaria;
- `archive_id uuid` con eliminazione a cascata;
- `source_response_id uuid`;
- `participant_name text`;
- `choices jsonb`;
- `submitted_at timestamptz`.

Entrambe le tabelle hanno RLS attiva e nessuna policy pubblica. Il browser non le interroga direttamente: pagina, route e azioni usano esclusivamente il client amministrativo server-side.

## Operazioni atomiche

Le mutazioni sensibili vengono implementate come funzioni SQL `security definer`, con `search_path` fissato e invocate soltanto dalle server action amministrative:

- archivia e azzera;
- ripristina archivio, archiviando prima eventuali risultati correnti;
- elimina definitivamente un archivio.

Le funzioni restituiscono solo identificativi e conteggi necessari all'interfaccia. Nessun errore database sensibile viene mostrato nel browser.

## Componenti e confini

- La pagina server carica risultati correnti e lista degli archivi.
- Un componente client isolato gestisce dialog, stato pending e invio delle server action.
- Le funzioni pure di normalizzazione, ranking, riepilogo e preparazione righe Excel restano separate e testabili.
- Una route amministrativa genera il download Excel dopo avere ricontrollato la sessione e il ruolo admin; accetta opzionalmente l'identificativo di un archivio.
- La pagina di dettaglio archivio riusa gli stessi componenti di presentazione della dashboard corrente.

## Sicurezza e casi limite

- Accesso negato agli utenti non amministratori sia nella UI sia nelle route/action.
- Nessun azzeramento se non esistono risposte.
- Conferma `AZZERA` esatta prima dell'operazione.
- Archivio creato e cancellazione dei dati correnti nella stessa transazione.
- Sanitizzazione dei valori esportati per impedire formula injection in Excel (`=`, `+`, `-`, `@`).
- Limiti e ordinamento coerenti con la dashboard esistente; l'esportazione comprende l'intero set selezionato.
- Errori mostrati con messaggi italiani sintetici e registrati lato server con dettagli tecnici.

## Verifica

### Test automatici

- selezione e validazione server richiedono esattamente 10 prodotti;
- le risposte storiche da 5 prodotti restano leggibili nelle statistiche e negli archivi;
- partecipanti ordinati correttamente;
- riepilogo e classifica coerenti;
- righe Excel e neutralizzazione delle formule;
- azzeramento rifiutato senza conferma corretta;
- azzeramento atomico, ripristino ed eliminazione tramite gateway testabile;
- route Excel negata ai non amministratori e valida per dataset corrente/archiviato;
- build, typecheck e suite completa.

### Verifica manuale

- desktop e mobile;
- ordine partecipanti → classifica → dettaglio → archivio;
- download e apertura del file in Microsoft Excel;
- navigazione da tastiera, focus e chiusura dialog con Escape/click esterno;
- azzeramento, archivio consultabile, ripristino e cancellazione definitiva;
- controllo finale nel database e nella produzione Vercel.
