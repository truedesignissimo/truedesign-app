# Archivio PC — redesign per reparto

## Obiettivo

Rendere l’archivio più compatto, leggibile e vicino al prototipo originale fornito nello ZIP, privilegiando il confronto immediato delle dotazioni hardware.

## Struttura della pagina

- Header e riepilogo generale restano essenziali.
- Ricerca e filtri restano disponibili.
- I risultati vengono raggruppati per `area`, nell’ordine: Ufficio Tecnico, Commerciale, Marketing, Logistica, Amministrazione, Produzione, Da assegnare.
- Ogni gruppo mostra un titolo grande e il conteggio dei PC.
- Ogni gruppo usa una griglia di 4 colonne desktop, 2 tablet e 1 mobile.
- Filtri e ricerca nascondono i gruppi vuoti; il conteggio riflette i risultati visibili.

## Scheda PC

- Card bianca compatta, altezza uniforme e angoli coerenti con il design system.
- Area immagine a dimensione fissa; ogni foto usa `object-fit: contain`, con ingombro visivo massimo uniforme per notebook e desktop.
- Badge in alto a destra `Potenza N`, unico dato prestazionale sempre visibile.
- Il badge espone via tooltip accessibile fascia, attendibilità e natura provvisoria del voto.
- Nome assegnatario, tipologia, marca e modello.
- CPU messa in evidenza con sigla sintetica (`i5`, `i7`, `i9`, `M4`, `Xeon`, `Ryzen`, `Ultra`) e descrizione completa.
- RAM in grande evidenza, seguita da GPU e schermo solo quando presente.
- Profilo, testo “voto provvisorio” e attendibilità non compaiono nel corpo della card.
- Il click apre la scheda completa esistente, che conserva dettagli, motivazioni e dati mancanti.

## Iconografia hardware

- Le icone CPU, RAM, GPU e schermo sono vettoriali monocromatiche e non dipendono da marchi esterni.
- La sigla CPU riprende il colpo d’occhio del prototipo senza copiare loghi Intel, AMD o Apple.

## Icona dell’app

- Aggiungere la chiave `computer` al sistema condiviso `AppIcon`.
- Mappare `/apps/archivio-pc` alla nuova icona.
- Il disegno combina monitor e torre PC con lo stesso tratto e peso delle icone delle altre app.
- Aggiornare il test della mappatura.

## Interazione e accessibilità

- Il tooltip del voto funziona anche con focus da tastiera tramite `title` e testo accessibile.
- Se il voto non è disponibile il badge mostra `Potenza —`.
- La selezione per stampa resta disponibile ma non domina la gerarchia visiva.
- Ricerca, filtri, dialog e stampa continuano a funzionare.

## Verifica

- Test di raggruppamento e ordine dei reparti.
- Test SSR della card: badge compatto, CPU/RAM/GPU visibili, attendibilità assente dal corpo ma presente nel tooltip.
- Test dell’icona nel catalogo.
- Verifica responsive visiva a desktop, tablet e mobile.
- Test completi, typecheck e build prima della pubblicazione.

## Vincoli

- Nessuna nuova dipendenza.
- Nessuna modifica ai dati o al calcolo dei punteggi.
- Nessuna modifica Supabase.
- Le modifiche fuori da `src/app/apps/archivio-pc/` sono limitate ai tre file condivisi necessari per l’icona: `app-icon-model.ts`, `app-icon.tsx` e `app-icon.test.ts`.
