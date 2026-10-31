# Archivio PC — filtro “Da sostituire prima”

## Obiettivo

Semplificare l’accesso all’archivio eliminando il blocco iniziale di ricerca,
filtri e ordinamenti. L’unica vista alternativa deve aiutare a individuare i
computer da sostituire con maggiore urgenza in base all’uso assegnato.

## Comportamento

- All’apertura, l’app mostra tutti i computer, divisi per reparto come oggi.
- Al posto dei controlli iniziali compare un solo comando:
  `Da sostituire prima`.
- Attivando il comando, l’elenco mostra al massimo sei computer.
- I computer sono ordinati dal punteggio più basso al più alto.
- Il punteggio usato è quello calcolato per il profilo già assegnato al
  computer: Ufficio, Tecnico, Grafica o Render.
- Un computer non viene quindi penalizzato o favorito da prestazioni che non
  sono rilevanti per il suo impiego.
- I computer privi di un punteggio calcolabile sono esclusi dalla graduatoria,
  perché i dati mancanti non devono trasformarsi automaticamente in una
  priorità di acquisto.
- Quando la vista prioritaria è attiva, il comando diventa `Mostra tutti`.
- Uscendo dalla vista prioritaria, torna l’archivio completo diviso per reparto.

## Presentazione

La vista prioritaria riusa le stesse schede hardware dell’archivio, senza una
seconda variante grafica. I sei computer restano raggruppati per reparto, così
la priorità non perde il contesto organizzativo. Il conteggio comunica quanti
computer sono mostrati.

Il comando singolo deve essere evidente ma coerente con il linguaggio visivo
grigio scuro e blu dell’app. Non vengono introdotte nuove librerie o nuovi
pattern di interazione.

## Regole di calcolo

La graduatoria usa `assessPerformance(pc).score`, che rappresenta già il voto
ponderato per `pc.profilo`. Il confronto è numerico crescente. In caso di
parità, si usa l’assegnatario in ordine alfabetico per ottenere un risultato
stabile e riproducibile.

Questa vista non modifica i punteggi, le raccomandazioni o i profili esistenti:
li rende solamente più accessibili.

## Verifica

- Test unitario della selezione dei sei punteggi più bassi.
- Test di esclusione dei punteggi non calcolabili.
- Test dell’ordine stabile in caso di parità.
- Test dell’interfaccia senza i vecchi controlli e con il solo comando
  `Da sostituire prima` / `Mostra tutti`.
- Verifica responsive e build di produzione prima della pubblicazione.

