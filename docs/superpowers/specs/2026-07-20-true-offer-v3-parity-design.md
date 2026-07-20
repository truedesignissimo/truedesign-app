# TRUE Generatore Offerte V3 — porting fedele su True App

Data: 20 luglio 2026  
Stato: approvato dall'utente il 20 luglio 2026

## Obiettivo

Sostituire l'interfaccia React ridotta attualmente pubblicata in
`/apps/true-generatore-offerte` con un porting fedele della V3 originale,
mantenendo la piattaforma Next.js, l'autenticazione True App e la persistenza
Supabase introdotte durante la migrazione.

La V3 originale è il riferimento funzionale e visivo. Il confronto deve essere
eseguito contro:

- `/Users/dariobreg/Documents/Codex/generatore offerte/TRUE Generatore Offerte/dist/index.html`;
- gli asset e i dati nella stessa cartella `dist`;
- il builder canonico `build_v2_offer.py` e i relativi test;
- il PDF ufficiale per prezzi, varianti, tessuti, finiture ed extra charge.

La generazione AI delle immagini resta esclusa dall'app pubblicata. Rimangono
disponibili il caricamento manuale di immagini custom e il documento tecnico
che conserva l'architettura AI per un ripristino futuro.

## Approccio scelto

Porting React nativo e fedele. Non verranno usati iframe e non verrà applicata
una semplice correzione cosmetica all'interfaccia ridotta.

Il markup, la gerarchia visiva, i controlli e i flussi della V3 originale
saranno riprodotti in componenti React, mentre catalogo, salvataggi e immagini
continueranno a usare gli adapter Next.js/Supabase già presenti.

## Contratto visivo

L'app deve riprodurre la V3 originale a desktop e mobile:

- font Suisse Intl servito localmente;
- sfondo crema, palette nero/oro/grigio e bordi sottili;
- contenitore centrale da 1200 px;
- header TRUE con titolo, selettore listino a due punti e selettore lingua;
- banner informativo sotto l'header;
- sezioni bianche con titoli maiuscoli oro;
- griglia completa dei dati cliente e commerciali;
- ricerca prodotti a tutta larghezza;
- tabella commerciale orizzontalmente scorrevole;
- riepilogo economico allineato a destra;
- azioni anteprima, PDF e reset nello stesso ordine;
- archivio offerte in fondo alla pagina;
- footer societario e data di aggiornamento;
- comportamento responsive equivalente alla V3 originale.

Il collegamento alla dashboard True App deve essere discreto e non sostituire
l'header originale.

## Contratto funzionale

### Offerta

Devono essere presenti e persistiti:

- numero e data offerta;
- validità in giorni e data calcolata;
- listino ITA/ENG o ENG/FRA;
- lingua del documento: italiano, inglese, francese, tedesco, e le altre lingue
  già previste dalla V3 originale quando supportate dal relativo dizionario;
- nome, azienda, partita IVA/codice fiscale, email, telefono e indirizzo;
- riferimento progetto, referente commerciale e condizioni di pagamento;
- aliquota IVA;
- sconto globale con espressioni concatenate, per esempio `50+5`;
- visibilità degli sconti e dei prezzi netti nel PDF;
- opzioni Classe 1IM e verniciatura ignifuga;
- note descrittive dell'offerta.

### Righe prodotto

Ogni riga deve mantenere:

- codice, nome, famiglia, quantità e immagine proporzionale;
- configurazione completa di finiture, tessuti, categorie e componenti;
- prezzi distinti per listino;
- sconto riga concatenato;
- extra charge ufficiali, esenzione per quantità e sovrapprezzo manuale;
- opzioni Classe 1IM e ignifugo applicabili;
- note riga;
- caricamento e sostituzione dell'immagine custom;
- totale riga e aggiornamento immediato dei totali.

La ricerca e l'ordine dei risultati devono seguire il comportamento della V3
originale: codice, famiglia e nome, con accessori dopo i prodotti principali.

### Archivio e autosalvataggio

L'autosalvataggio continua a usare `commercial_offers` e deve conservare tutti
i nuovi campi senza perdita di compatibilità con le offerte già salvate.
L'archivio deve elencare, aprire ed eliminare le offerte dell'utente corrente.
Le immagini custom restano nel bucket privato `commercial-offer-images` e
vengono risolte tramite URL firmati al caricamento di un'offerta.

### PDF

Anteprima e download devono usare lo stesso modello commerciale della V3
originale:

- logo e metadati entro i margini;
- testi compatti;
- immagini sempre proporzionali e mai schiacciate;
- configurazioni sintetiche ma complete;
- colonne, sconti, IVA, totali, pagamento e note coerenti con le opzioni;
- download abilitato solo dopo una generazione valida dell'anteprima.

## Architettura dei componenti

L'app resta all'interno di
`src/app/apps/true-generatore-offerte/` e viene suddivisa per responsabilità:

- `offer-generator.tsx`: orchestrazione, caricamento e autosalvataggio;
- `components/legacy-header.tsx`: brand, listino, lingua e stato;
- `components/customer-details.tsx`: dati cliente e commerciali;
- `components/commercial-options.tsx`: IVA, sconti e opzioni speciali;
- `components/product-search.tsx`: ricerca e selezione;
- `components/offer-lines.tsx`: tabella e righe configurabili;
- `components/product-configurator.tsx`: varianti e materiali;
- `components/offer-totals.tsx`: calcoli economici;
- `components/pdf-preview.tsx`: anteprima e download;
- `components/offer-archive.tsx`: archivio Supabase;
- `domain/`: tipi, prezzi, sconti concatenati e trasformazioni;
- `data/`: catalogo, repository e storage immagini.

I componenti possono essere ulteriormente suddivisi quando un file supera una
responsabilità chiara, senza modificare la struttura della piattaforma esterna
alla cartella dell'app.

## Flusso dei dati

1. La pagina server verifica l'utente tramite il layout True App.
2. Il client carica catalogo, tessuti e offerte dell'utente in parallelo.
3. Il reducer crea o ripristina un'offerta con uno schema versionato.
4. Ogni modifica aggiorna immediatamente interfaccia e totali.
5. Un debounce salva il payload completo su Supabase.
6. Le immagini custom vengono caricate nel bucket e il percorso viene salvato
   nella riga.
7. Anteprima e PDF leggono lo stesso stato dell'offerta, evitando duplicazioni
   della logica commerciale.

Le offerte salvate con lo schema ridotto vengono migrate in lettura applicando
default sicuri ai campi mancanti.

## Gestione errori

- errore catalogo: schermata esplicita con possibilità di riprovare;
- errore salvataggio: stato visibile senza perdere le modifiche locali;
- errore upload: anteprima locale rimossa e riga lasciata invariata;
- prezzo non individuato: nuova verifica del prodotto nel catalogo e nel PDF
  ufficiale prima di segnalarlo come assente;
- configurazione incompleta: messaggio contestuale sulla riga;
- errore PDF: download disabilitato e anteprima precedente non considerata
  valida.

## Verifica e criteri di accettazione

Il porting è accettabile soltanto quando:

1. un test strutturale dimostra la presenza di tutti i campi, sezioni e azioni
   della V3 originale;
2. i test unitari coprono sconti concatenati, IVA, validità, listini, extra e
   migrazione delle offerte ridotte;
3. i test esistenti di catalogo, prezzi, repository, immagini e PDF restano
   verdi;
4. typecheck e build Next.js terminano senza errori;
5. un confronto visivo desktop e mobile tra V3 originale e porting conferma la
   stessa struttura, tipografia, palette, densità e ordine delle sezioni;
6. un'offerta di prova completa può essere creata, salvata, riaperta, dotata di
   immagine custom, mostrata in anteprima e scaricata come PDF;
7. il deploy Vercel termina con stato `success` e la rotta autenticata risponde
   correttamente.

## Fuori ambito

- generazione immagini Gemini/OpenAI;
- modifica dei prezzi o interpretazione commerciale diversa dai PDF ufficiali;
- cambiamenti generali alla dashboard True App;
- nuove tabelle Supabase, salvo una migrazione strettamente necessaria e
  compatibile per il payload JSON già supportato.
