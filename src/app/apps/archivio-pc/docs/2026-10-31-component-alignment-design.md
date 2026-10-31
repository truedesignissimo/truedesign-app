# Archivio PC — allineamento componenti e avvisi

## Obiettivo

Rendere più ordinata la lettura delle tre specifiche principali nelle schede
PC: processore, RAM e GPU. Ridurre il peso visivo dei loghi CPU e segnalare in
modo discreto i dati hardware non ancora confermati.

## Struttura delle specifiche

Ogni riga usa la stessa griglia a due colonne:

1. indicatore del componente;
2. descrizione del componente.

La descrizione di CPU, RAM e GPU inizia quindi sulla stessa verticale. Nella
riga CPU il logo del processore sostituisce l’icona generica e occupa la prima
colonna; nelle righe RAM e GPU restano l’icona e la relativa etichetta.

Il logo CPU viene ridotto a circa 32 px e centrato verticalmente rispetto alla
descrizione completa del processore. Il testo delle tre descrizioni usa una
dimensione e un’interlinea coerenti. La capacità RAM conserva una moderata
enfasi tipografica, inferiore a quella attuale.

## Indicatore di attenzione

Una piccola icona triangolare compare accanto alla singola descrizione quando
il valore contiene esplicitamente `da verificare`. L’icona non viene mostrata
come badge generale della scheda e non viene aggiunta ai dati semplicemente
mancanti.

L’indicatore:

- usa il blu dell’interfaccia;
- misura circa 14 px;
- include testo accessibile e tooltip `Informazione da verificare`;
- non sostituisce né nasconde il testo originale.

## Ambito

La modifica riguarda le specifiche sintetiche nelle card. Il riepilogo
dettagliato mantiene la struttura esistente e continua a elencare i dati da
completare nella propria sezione.

## Verifica

- Test del rilevamento dei valori `da verificare` senza falsi positivi.
- Test della presenza dell’icona e del testo accessibile solo sulla riga
  interessata.
- Test della nuova struttura CPU senza l’icona generica duplicata.
- Verifica responsive, TypeScript e build prima della pubblicazione.

