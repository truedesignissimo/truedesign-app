# Analisi Competitor dinamica — specifica funzionale e tecnica

Data: 2026-07-21
Stato: approvata a livello architetturale; in attesa di revisione della specifica
Route: `/apps/analisi-competitor`

## Obiettivo

Trasformare il report statico esistente in uno strumento Next.js nativo di
Competitive Intelligence, riservato agli utenti autorizzati e coerente con il
design system True Design. Ogni utente avrà una watchlist indipendente e potrà
consultare aggiornamenti recenti, verificabili e confrontati con la ricerca
precedente.

Il vincolo principale è mantenere l'app leggera: poche chiamate esterne, poco
calcolo serverless, dati compatti e nessun crawling completo durante le richieste
web.

## Decisioni principali

- Architettura: Next.js + Supabase + Tavily Search API.
- Provider iniziale: Tavily con ricerca `basic`.
- Nessun modello generativo nell'MVP.
- Nessun Playwright, crawling diretto, screenshot o salvataggio di pagine complete
  nel runtime web.
- Cache condivisa tra utenti: al massimo una ricerca effettiva per azienda per
  giorno UTC.
- Il report statico diventa una baseline editoriale tipizzata e viene renderizzato
  con componenti Next.js. Dopo il cutover, l'HTML dell'iframe viene rimosso.

## Esperienza utente

### Struttura della pagina

1. Testata coordinata con truedesign.app e titolo “Competitive Intelligence”.
2. Ricerca per nome o dominio e azione di aggiunta alla watchlist.
3. Selettore compatto della watchlist personale.
4. Dettaglio dell'azienda selezionata.
5. Archivio della baseline editoriale esistente: classifica, temi e insight.

Su desktop, selettore e dettaglio possono formare una composizione a due colonne.
Su mobile diventano sezioni verticali. Lo scorrimento orizzontale è ammesso solo
per il selettore compatto dei competitor.

### Selettore competitor

- Area interattiva minima 44×44 px; logo visivo circa 24–28 px.
- Asset locali trasparenti per i brand già presenti.
- Nome visibile in hover e `focus-visible` tramite tooltip accessibile.
- `aria-label` sempre presente.
- Fallback sobrio con wordmark testuale e dominio, senza favicon Google o iniziali
  decorative.
- Stato selezionato comunicato con forma, bordo e testo, non soltanto con colore.

### Aggiunta e rimozione

- Prima ricerca nell'anagrafica già nota.
- Se l'azienda non esiste, Tavily propone al massimo 3 risultati candidati;
  l'utente conferma nome e dominio ufficiale prima dell'aggiunta. Questa ricerca
  usa lo stesso limite giornaliero delle ricerche di aggiornamento.
- La normalizzazione e la validazione del dominio avvengono lato server.
- Il vincolo univoco sul dominio e quello sulla coppia utente/azienda impediscono i
  duplicati.
- La rimozione richiede due passaggi inline: “Rimuovi” e conferma esplicita con il
  nome dell'azienda. Nessun popup browser.
- Successi ed errori sono mostrati in una regione `aria-live`.

### Dettaglio azienda

Le informazioni restano separate in tre blocchi:

1. **Aggiornamenti verificati**: titolo, fonte, URL, data dichiarata e breve
   evidenza restituita dal provider.
2. **Riepilogo**: sintesi estrattiva e deterministica degli aggiornamenti, composta
   soltanto dai titoli e dalle evidenze conservate.
3. **Lettura per True Design**: segnali classificati con regole trasparenti
   (prodotto, collezione, progetto, campagna, collaborazione, sostenibilità,
   acquisizione, posizionamento, editoriale) e chiaramente etichettati come
   interpretazione.

Se nessun risultato supera le verifiche minime, l'interfaccia dichiara “Nessun
aggiornamento verificabile trovato”. Una data assente non viene stimata.

## Budget di risorse

### Ricerca

- Una sola chiamata Tavily `basic` per aggiornamento.
- Massimo 8 risultati richiesti e conservati.
- Query unica che combina nome, dominio e categorie di aggiornamento in italiano e
  inglese.
- Cache valida per il giorno UTC corrente, condivisa tra tutti gli utenti.
- Aperture successive leggono esclusivamente Supabase.
- Limite personale: massimo 5 chiamate esterne totali al giorno, includendo ricerca
  di nuove aziende e aggiornamenti.
- Limite globale aggiornamenti: massimo una chiamata per azienda per giorno UTC.
- Le ricerche di una nuova azienda sono deduplicate per query normalizzata e giorno
  UTC.
- Timeout provider: 8 secondi.
- In caso di errore viene restituito l'ultimo snapshot riuscito con un avviso.

Con il piano gratuito Tavily da 1.000 crediti, questo profilo consente fino a 1.000
aggiornamenti effettivi al mese. Le aperture servite dalla cache non consumano
crediti.

### Dati e calcolo

- Nessun HTML completo, immagine remota o screenshot salvato negli snapshot.
- Evidenze testuali troncate a 600 caratteri per fonte; riepilogo complessivo
  limitato a 1.200 caratteri.
- Massimo 12 ricerche di aggiornamento conservate per azienda; quelle più vecchie
  vengono eliminate dopo un inserimento riuscito. Le ricerche di aziende non
  confermate vengono eliminate dopo 7 giorni.
- Diff basato su URL canonici e fingerprint dei campi normalizzati, senza confronto
  di documenti lunghi.
- Nessun polling continuo: una richiesta utente produce una sola risposta.
- Nessuna nuova libreria UI.

## Modello dati Supabase

Si aggiunge una sola migrazione versionata e non si modificano le tabelle esistenti.

### `ci_companies`

- `id uuid primary key`
- `name text not null`
- `normalized_domain text not null unique`
- `website_url text not null`
- `logo_path text`
- `created_at timestamptz`

Lettura consentita agli utenti autenticati. Scrittura soltanto attraverso codice
server-side autorizzato.

### `ci_watchlist_items`

- `user_id uuid references auth.users(id) on delete cascade`
- `company_id uuid references ci_companies(id) on delete cascade`
- `created_at timestamptz`
- chiave primaria composta `(user_id, company_id)`

RLS per `select`, `insert` e `delete` con `auth.uid() = user_id`. Il browser non
invia mai `user_id`; viene ricavato dalla sessione server-side.

### `ci_search_runs`

- `id uuid primary key`
- `kind text not null` (`company_discovery` oppure `company_update`)
- `company_id uuid references ci_companies(id) on delete cascade` nullable soltanto
  per `company_discovery`
- `requested_by uuid references auth.users(id) on delete set null`
- `query_hash text not null`
- `cache_key text not null unique`
- `provider text not null`
- `status text not null`
- `results jsonb not null`
- `summary jsonb not null`
- `fingerprint text`
- `fetched_at timestamptz`
- `expires_at timestamptz`
- `error_code text`

RLS attiva senza policy client: accesso diretto negato agli utenti. Le route
autenticate leggono e scrivono tramite service role e non restituiscono
`requested_by`. La stessa tabella conserva gli snapshot, deduplica le chiamate e
applica il rate limit contando soltanto le chiamate esterne realmente eseguite.

## Autenticazione e sicurezza

- Ogni Server Action e Route Handler chiama `supabase.auth.getUser()`.
- Nessun payload accetta `user_id` o decide l'identità dal client.
- Si applicano controlli su origine, content type e dimensione del payload seguendo
  i pattern già presenti nel repository.
- I domini vengono convertiti in forma canonica e devono usare HTTPS.
- Sono rifiutati URL con credenziali, porte arbitrarie, localhost, IP letterali,
  indirizzi privati e protocolli differenti da HTTPS.
- La chiave `TAVILY_API_KEY` resta esclusivamente server-side e non usa il prefisso
  `NEXT_PUBLIC_`.
- Le risposte del provider sono trattate come dati non fidati: URL, lunghezze, date
  e campi testuali vengono validati prima del salvataggio.
- Le fonti vengono aperte con `rel="noopener noreferrer"`.

## Flusso di ricerca

1. La route autentica l'utente dalla sessione.
2. Normalizza l'azienda richiesta e verifica l'autorizzazione alla route app.
3. Cerca una ricerca riuscita con `cache_key` del giorno UTC corrente.
4. Se esiste, lo restituisce senza chiamate esterne.
5. Se non esiste, applica il limite personale e tenta di creare il record con
   `cache_key` univoco. Il vincolo impedisce richieste concorrenti duplicate.
6. Interroga Tavily una sola volta con timeout.
7. Normalizza fonti, URL e date; elimina duplicati e risultati insufficienti.
8. Produce riepilogo, categorie e fingerprint con funzioni deterministiche.
9. Salva il risultato compatto, confronta il fingerprint con il precedente e
   conserva soltanto le ultime 12 ricerche di aggiornamento.
10. Restituisce i dati senza identificativi personali.

## Confini dei moduli

- `domain/company`: normalizzazione di nome, URL e dominio.
- `domain/sources`: validazione, canonicalizzazione e deduplica delle fonti.
- `domain/summary`: categorie e sintesi estrattiva.
- `domain/diff`: confronto fra snapshot.
- `services/search-provider`: interfaccia astratta del provider.
- `services/tavily`: implementazione Tavily e timeout.
- `data/repository`: query Supabase e applicazione dei limiti.
- `actions`: aggiunta e rimozione della watchlist.
- `api/research`: ricerca autenticata e risposta normalizzata.
- `components`: selettore, ricerca, dettaglio, fonti, feedback e archivio.
- `data/baseline`: contenuto editoriale estratto dal report statico.

## Migrazione dall'iframe

1. Estrarre il JSON editoriale in un modulo dati canonico senza riscriverne il
   contenuto.
2. Costruire e testare la UI nativa contro quel modulo.
3. Integrare watchlist e ricerca dinamica.
4. Verificare la parità dei contenuti editoriali utili.
5. Sostituire la route iframe e rimuovere `index.html` nello stesso cutover.

Le immagini editoriali esistenti possono restare nella cartella pubblica corrente;
non esisteranno due renderer attivi o due copie modificabili della baseline.

## Accessibilità e stile

- Suisse Int’l e token globali `--bg`, `--surface`, `--border`, `--text`, `--muted`,
  `--accent` e relativi stati.
- Palette terra/giallo tono su tono, senza gradienti decorativi.
- Bordi sottili, superfici prevalentemente aperte e raggi coerenti.
- Contrasto WCAG AA, label reali, navigazione completa da tastiera.
- Stati hover, focus, loading, disabled, successo, errore ed empty.
- Transizioni fra 160 e 300 ms e rispetto di `prefers-reduced-motion`.
- Verifica desktop, tablet e mobile prima della consegna.

## Strategia TDD e verifica

L'implementazione segue cicli test rosso → codice minimo → test verde. I test
copriranno:

- normalizzazione e rifiuto dei domini pericolosi;
- deduplica e validazione di fonti e date;
- sintesi deterministica e classificazione;
- confronto fra snapshot;
- cache e limiti di consumo;
- route non autenticata e assenza di `user_id` nei payload;
- isolamento RLS fra due utenti;
- duplicati nella watchlist;
- stati principali del selettore e del dettaglio.

Prima di dichiarare conclusa l'implementazione saranno eseguiti test completi,
typecheck, build e `git diff --check`, oltre alla verifica visuale desktop/mobile e
da tastiera. Nessuna pubblicazione avverrà senza una richiesta esplicita.

## Fuori scope per l'MVP

- Crawling completo o schedulato con Playwright.
- Analisi visiva automatica e nuovi screenshot.
- LLM per riscrivere le sintesi.
- Notifiche email o push.
- Discovery automatica periodica di nuovi competitor.
- Modifiche a `apps`, `profiles`, `user_apps` o `usage_log`.

Queste capacità potranno essere aggiunte soltanto dopo aver misurato utilizzo,
qualità delle fonti e consumo reale dell'MVP.
