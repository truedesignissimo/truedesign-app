# Archivio PC — redesign editoriale industriale

## Obiettivo

Rendere Archivio PC riconoscibile, tecnico e deciso, eliminando l'estetica da dashboard generica. La nuova interfaccia deve mantenere la densità utile dell'archivio, ma assumere una direzione editoriale industriale coerente con True Design.

## Direzione visiva approvata

- Base bianco ottico e nero, senza sfondi panna.
- Blu elettrico come unico accento funzionale e identitario.
- Suisse Int’l come carattere dell’intera applicazione, usando i file locali già presenti.
- Titoli di reparto sovradimensionati e numerazione visibile, trattati come aperture editoriali.
- Superfici piatte, bordi neri sottili e raggi più contenuti; niente ombre morbide, gradienti, glassmorphism o pillole decorative.
- Griglia desktop a quattro colonne, due su tablet e una su mobile.

## Schede PC

Ogni scheda mantiene fotografia, assegnatario, modello, potenza, CPU, RAM, GPU e schermo. La gerarchia cambia:

1. foto compatta e uniforme su campo bianco;
2. assegnatario e modello;
3. blocco CPU dominante con marchio/famiglia;
4. RAM in grande evidenza;
5. GPU e schermo come dati secondari;
6. punteggio di potenza come indice numerico asciutto.

Le card non mostrano “voto provvisorio” o “attendibilità”; queste informazioni restano nel tooltip accessibile del punteggio e nella scheda completa.

## Marchi dei processori

Il badge testuale generico viene sostituito da un componente dedicato che classifica il processore e mostra un marchio vettoriale locale:

- Intel Core i3/i5/i7/i9;
- Intel Core Ultra;
- Intel Xeon;
- AMD Ryzen;
- Apple M1/M2/M4.

I marchi sono ricostruiti come asset SVG locali e compatti, non caricati da servizi esterni. Devono essere leggibili a piccole dimensioni, avere testo alternativo utile e una variante neutra “CPU” per i processori non riconosciuti. I colori di marca sono limitati al blocco CPU; il resto dell’interfaccia resta nero, bianco e blu elettrico.

## Hero, filtri e reparti

- Hero più corto e più assertivo: titolo grande, indice totale e una riga informativa essenziale.
- Statistiche trasformate in una fascia nera ad alto contrasto.
- Filtri rettangolari e netti, con focus blu e senza aspetto da pillola.
- Ogni reparto apre con numero progressivo, nome molto grande, conteggio PC e linea blu.
- La separazione tra reparti deriva da tipografia, ritmo e colore, non da contenitori aggiuntivi.

## Dettaglio PC

La finestra di dettaglio adotta la stessa palette: pannello bianco, colonna visiva blu elettrico, tipografia Suisse Int’l e tabelle tecniche nere. Funzioni, contenuti e valutazione prestazionale restano invariati.

## Responsive e accessibilità

- Desktop: quattro schede per riga.
- Tablet: due schede per riga.
- Mobile: una scheda per riga, titoli reparto ridimensionati senza perdere gerarchia.
- Focus visibile blu, aree interattive minime di 44 px, contrasto AA e supporto `prefers-reduced-motion`.
- I loghi CPU non sostituiscono mai il nome completo del processore.

## Verifica

- Test unitario della classificazione dei processori e del marchio renderizzato.
- Test SSR delle card per assicurare che CPU completa e RAM restino visibili.
- Test esistenti per filtri, reparti e performance invariati.
- Typecheck, build e suite completa.
- Controllo visivo desktop e mobile sul deploy pubblico.

## Fuori ambito

- Nessuna modifica ai dati dei PC o al modello di scoring.
- Nessuna nuova dipendenza UI.
- Nessuna modifica a Supabase, permessi o visibilità dell’app.
