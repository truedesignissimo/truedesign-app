# Generazione immagini — archivio per reintroduzione futura

La prima versione Next.js pubblicata esclude intenzionalmente ogni funzione di generazione immagini. Rimane disponibile soltanto il caricamento manuale di JPEG, PNG e WebP.

## Implementazione legacy conservata

La sorgente storica è la V3 del progetto `TRUE Generatore Offerte` e contiene:

- `build_v2_offer.py`: UI di selezione motore, payload del configuratore e costante PHP `OPENAI_GENERATE_IMAGE_PHP`;
- `tests/test_build_v2_offer_openai.py`: contratto del router server-side e della gestione delle chiavi;
- `assets/image-generator/app.js`: flusso separato precedente;
- `assets/image-generator/api/generate-image.php`: proxy legacy;
- `tests/test_build_v2_offer_fabrics.py`: contratto dei riferimenti tessuto usati dal prompt;
- `dist/products-data.json`: reference, foto e disegni tecnici completi usati dal motore legacy.

Il commit storico locale di questa migrazione non copia endpoint PHP né segreti nel runtime Next.js. La distribuzione V3 pubblicata prima della migrazione resta una seconda fonte di recupero del comportamento, ma non è fonte commerciale: prezzi e opzioni continuano a provenire dai PDF ufficiali.

## Motori precedenti

### Google Gemini

- Router legacy verso il servizio immagini separato.
- Payload con prodotto, configurazione, tessuto, finiture, note e reference disponibili.
- Risposta normalizzata come immagine salvabile nell'archivio.

### OpenAI GPT Image

- Chiamata server-side all'Images Edit API.
- Fino a sei immagini reference non duplicate.
- Chiave letta esclusivamente da `OPENAI_API_KEY` lato server.
- Gestione distinta di errori di autorizzazione, payload e risposta immagine.

## Reintroduzione corretta in Next.js

1. Creare un route handler autenticato dentro la rotta applicativa.
2. Leggere le chiavi soltanto da variabili Vercel server-side.
3. Applicare rate limit, limite dimensioni, MIME allowlist e audit per utente.
4. Recuperare reference esatte per codice prodotto dal catalogo verificato.
5. Rendere obbligatoria almeno una reference ufficiale quando il prodotto la possiede.
6. Salvare il risultato nel bucket privato `commercial-offer-images` sotto il prefisso utente.
7. Aggiungere policy di costo e autorizzazione prima di esporre i controlli UI.
8. Ripristinare i test del router e aggiungere test end-to-end per entrambi i provider.

## Condizioni di accettazione future

- nessuna chiave nel browser o nel repository;
- nessuna generazione senza utente autenticato;
- nessun dettaglio prodotto inventato quando esiste una reference ufficiale;
- configurazione commerciale trasmessa senza reinterpretazioni;
- immagine generata sostituibile con un upload manuale;
- PDF sempre funzionante anche se il provider AI non risponde.
