# Correzioni schede PC — design

## Obiettivo

Correggere tre problemi visivi delle schede PC, soprattutto su mobile, senza modificare struttura, palette generale o motore di valutazione.

## Scheda processore

- Intel Core i5, i7 e i9 mostrano soltanto il rispettivo marchio blu.
- Non viene aggiunta alcuna cornice o secondo contenitore attorno al marchio.
- Il marchio resta evidente ma viene ridotto rispetto alla versione attuale, così da non dominare la riga CPU.
- Core Ultra, Xeon, Ryzen e Apple mantengono il trattamento esistente, con dimensioni coerenti con i marchi Intel Core.

## Fotografia del computer

- L'intera area fotografica della card diventa bianca.
- La fotografia viene mostrata direttamente sulla superficie bianca, senza effetto «quadrato bianco su fondo grigio».
- Le dimensioni dell'immagine restano uniformi tra i modelli e non cambiano la griglia a quattro colonne.

## RAM

- Nella card viene mostrata in evidenza soltanto la capacità, per esempio `32 GB`.
- Velocità e tecnologia, per esempio `2667 MT/s`, non compaiono nella card.
- Il valore completo resta disponibile nella scheda dettagliata, con la velocità in corpo più piccolo della capacità.

## Verifica

- Test automatico del valore RAM sintetico nella card e completo nel dettaglio.
- Controllo visivo desktop e mobile della superficie fotografica, della scala dei marchi CPU e dell'assenza di overflow.
