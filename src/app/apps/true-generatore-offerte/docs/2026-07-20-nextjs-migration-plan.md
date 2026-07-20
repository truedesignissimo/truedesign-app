# TRUE Generatore Offerte Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pubblicare TRUE Generatore Offerte come applicazione React nativa alla rotta `/apps/true-generatore-offerte`, con persistenza Supabase, upload immagini custom e PDF, senza generazione immagini AI.

**Architecture:** Il dominio commerciale resta separato dalla UI; un esportatore deterministico converte la distribuzione V3 in cataloghi e asset statici. Il client React usa Supabase con RLS per offerte e immagini private. La pagina è protetta dal middleware condiviso e viene distribuita da Vercel.

**Tech Stack:** Next.js 14.2.5, React 18.3, TypeScript 5.5, Supabase JS 2.45, jsPDF 2.5+, Vitest, Python 3 standard library.

## Global Constraints

- I PDF ufficiali sono la fonte commerciale assoluta.
- Nessuna reinterpretazione di prezzi, finiture, tessuti, varianti o extra durante l'esportazione.
- Nessun endpoint, controllo UI o segreto OpenAI/Gemini nella build.
- Le immagini custom devono mantenere le proporzioni in UI e PDF.
- Le offerte e le immagini devono essere isolate per utente tramite RLS.
- Modifiche esterne alla cartella della rotta limitate a `package.json`, lockfile, middleware, layout `/apps`, migrazione Supabase e asset statici generati.

---

### Task 1: Test harness e contratti di dominio

**Files:**
- Modify: `package.json`
- Create: `src/app/apps/true-generatore-offerte/domain/types.ts`
- Create: `src/app/apps/true-generatore-offerte/domain/pricing.ts`
- Create: `src/app/apps/true-generatore-offerte/domain/pricing.test.ts`

**Interfaces:**
- Produces: `CatalogProduct`, `Offer`, `OfferLine`, `PriceList`, `calculateLineTotal(line)`, `calculateOfferTotals(offer)`.

- [ ] Aggiungere `vitest`, `jspdf`, script `test` e `typecheck`.
- [ ] Scrivere test fallenti per prezzo unitario, quantità, extra, sconto riga, sconto globale e cambio listino.
- [ ] Eseguire `npm test -- pricing.test.ts` e verificare il fallimento per moduli mancanti.
- [ ] Implementare tipi serializzabili e funzioni pure con arrotondamento monetario a due decimali.
- [ ] Eseguire test e typecheck con esito positivo.
- [ ] Commit: `feat: add offer domain and pricing contracts`.

### Task 2: Esportazione deterministica del catalogo V3

**Files:**
- Create: `src/app/apps/true-generatore-offerte/tools/export-v3-catalog.py`
- Create: `src/app/apps/true-generatore-offerte/tools/test_export_v3_catalog.py`
- Create: `public/apps/true-generatore-offerte/data/products.json`
- Create: `public/apps/true-generatore-offerte/data/fabrics.json`
- Create: `public/apps/true-generatore-offerte/data/catalog-meta.json`
- Create: `public/apps/true-generatore-offerte/images/products/*`
- Create: `public/apps/true-generatore-offerte/images/fabrics/*`

**Interfaces:**
- Consumes: directory V3 con `products-app.json`, `products-data.json`, `fabrics-data.json`.
- Produces: catalogo senza Base64 con gli stessi 697 codici e riferimenti asset statici.

- [ ] Scrivere fixture e test fallenti che richiedano conservazione esatta di codici, prezzi ITA/FRA, finiture, categorie tessuto, componenti ed extra.
- [ ] Aggiungere test che richieda estrazione Base64 in file e assenza di campi Base64 nei JSON finali.
- [ ] Implementare CLI `python export-v3-catalog.py --source <dist> --output <public-dir>`.
- [ ] Generare nomi asset tramite SHA-256 del contenuto per evitare collisioni e cache stale.
- [ ] Eseguire test Python e confrontare conteggi e hash con la V3 sorgente.
- [ ] Generare gli asset reali dal progetto canonico in Documenti.
- [ ] Commit: `feat: export verified V3 catalog for Next.js`.

### Task 3: Caricamento catalogo e stato offerte

**Files:**
- Create: `src/app/apps/true-generatore-offerte/data/catalog.ts`
- Create: `src/app/apps/true-generatore-offerte/state/offer-reducer.ts`
- Create: `src/app/apps/true-generatore-offerte/state/offer-reducer.test.ts`

**Interfaces:**
- Produces: `loadCatalog(): Promise<Catalog>`, `offerReducer(state, action)`, `createEmptyOffer(userId)`.

- [ ] Scrivere test fallenti per creazione offerta, aggiunta/rimozione riga, cambio listino, quantità e configurazione prodotto.
- [ ] Implementare fetch parallelo dei due cataloghi statici con validazione minima di versione e conteggi.
- [ ] Implementare reducer immutabile senza side effect.
- [ ] Verificare che il cambio listino ricalcoli tutte le righe senza perdere configurazioni.
- [ ] Commit: `feat: add catalog loader and offer state`.

### Task 4: Schema Supabase e persistenza isolata

**Files:**
- Create: `supabase/migrations/20260720_true_commercial_offers.sql`
- Create: `src/app/apps/true-generatore-offerte/data/offers-repository.ts`
- Create: `src/app/apps/true-generatore-offerte/data/offers-repository.test.ts`
- Create: `src/app/apps/true-generatore-offerte/data/image-storage.ts`

**Interfaces:**
- Produces: `listOffers(userId)`, `loadOffer(id)`, `saveOffer(offer)`, `deleteOffer(id)`, `uploadLineImage(args)`, `getSignedImageUrl(path)`.

- [ ] Scrivere test fallenti usando un adapter Supabase iniettato, verificando sempre filtro `user_id`.
- [ ] Creare tabella `commercial_offers`, indici, trigger `updated_at` e policy SELECT/INSERT/UPDATE/DELETE con `auth.uid() = user_id`.
- [ ] Creare bucket privato `commercial-offer-images` e policy sul primo segmento del path uguale a `auth.uid()`.
- [ ] Implementare repository tipizzato e messaggi d'errore recuperabili.
- [ ] Implementare upload con allowlist JPEG/PNG/WebP e limite 10 MB.
- [ ] Verificare SQL in Supabase e testare isolamento con due utenti distinti.
- [ ] Commit: `feat: persist offers and custom images in Supabase`.

### Task 5: Interfaccia React del configuratore

**Files:**
- Create: `src/app/apps/true-generatore-offerte/page.tsx`
- Create: `src/app/apps/true-generatore-offerte/offer-generator.tsx`
- Create: `src/app/apps/true-generatore-offerte/offer-generator.module.css`
- Create: `src/app/apps/true-generatore-offerte/components/offer-header.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/product-search.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/product-configurator.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/offer-lines.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/offer-totals.tsx`
- Create: `src/app/apps/true-generatore-offerte/components/offer-archive.tsx`

**Interfaces:**
- Consumes: catalog loader, reducer, repositories.
- Produces: UI completa desktop/mobile senza controlli AI.

- [ ] Creare page server-side che ottiene l'utente e passa `userId` al client.
- [ ] Implementare shell client con caricamento/error state e autosave debounced.
- [ ] Implementare ricerca pesata per codice, famiglia e nome, con accessori dopo i prodotti.
- [ ] Implementare configuratore guidato dai dati: varianti, finiture, colori, tessuti ed extra.
- [ ] Implementare righe compatte, quantità, rimozione e immagine custom senza deformazioni.
- [ ] Implementare totali e archivio offerte.
- [ ] Verificare navigazione tastiera, label e responsive a 390 px.
- [ ] Commit: `feat: build native React offer configurator`.

### Task 6: Anteprima e PDF

**Files:**
- Create: `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.ts`
- Create: `src/app/apps/true-generatore-offerte/pdf/build-offer-pdf.test.ts`
- Create: `src/app/apps/true-generatore-offerte/components/pdf-preview.tsx`

**Interfaces:**
- Produces: `buildOfferPdf(offer, assets): Promise<jsPDF>`, `openPdfPreview()`, `downloadPdf()`.

- [ ] Scrivere test fallenti per dimensionamento proporzionale immagini e descrizioni sintetiche.
- [ ] Implementare testata con logo ridotto e blocco metadati entro margini A4.
- [ ] Implementare righe con altezza calcolata e page break prima dell'overflow.
- [ ] Dare priorità all'immagine custom; usare foto/disegno catalogo come fallback.
- [ ] Bloccare download finché l'anteprima non è stata generata con successo.
- [ ] Confrontare visivamente PDF con i casi NE 90, EQ 2203, KA 100CU e NT 4090.
- [ ] Commit: `feat: add proportional offer PDF preview`.

### Task 7: Protezione piattaforma e dashboard

**Files:**
- Modify: `src/middleware.ts`
- Create: `src/app/apps/layout.tsx`
- Create: `src/app/apps/true-generatore-offerte/dashboard-record.sql`

**Interfaces:**
- Produces: protezione sessione per `/apps/:path*` e record dashboard idempotente.

- [ ] Aggiungere `/apps` alle rotte protette del middleware.
- [ ] Creare layout server che reindirizza utenti anonimi a `/login`.
- [ ] Preparare upsert del record `apps` con URL e descrizione approvati.
- [ ] Verificare redirect anonimo, accesso autenticato e visibilità dashboard.
- [ ] Commit: `feat: secure and register offer generator route`.

### Task 8: Archivio tecnico della generazione immagini

**Files:**
- Create: `src/app/apps/true-generatore-offerte/docs/future-image-generation.md`
- Test: repository-wide search.

**Interfaces:**
- Produces: inventario recuperabile senza codice runtime AI.

- [ ] Documentare motori precedenti, flusso reference, endpoint e prerequisiti futuri senza copiare chiavi.
- [ ] Registrare percorso del progetto sorgente e test storici.
- [ ] Verificare che UI e bundle non contengano `OpenAI`, `Gemini`, `generate-image` o nomi di variabili segrete.
- [ ] Commit: `docs: preserve future image generation design`.

### Task 9: Verifica e consegna

**Files:**
- Modify only files necessari a correggere problemi emersi.
- Create: `true-generatore-offerte-nextjs.zip` fuori dal repository.

**Interfaces:**
- Produces: branch verificato, archivio importabile e dati dashboard.

- [ ] Eseguire test Python dell'esportatore.
- [ ] Eseguire `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.
- [ ] Avviare Next.js e fare smoke test autenticato desktop/mobile.
- [ ] Verificare salvataggio, riapertura, upload custom e PDF.
- [ ] Verificare assenza funzionalità AI e assenza di segreti.
- [ ] Creare ZIP escludendo `.git`, `.next`, `node_modules` ed `.env*`.
- [ ] Verificare ZIP con `unzip -t` e produrre checksum SHA-256.
- [ ] Consegnare slug, descrizione, file, istruzioni SQL e stato dei controlli.
