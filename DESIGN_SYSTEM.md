# True Design — UI/UX Design System

Queste regole sono obbligatorie per la piattaforma `truedesign.app` e per le
app che vi vengono integrate, salvo richieste esplicite diverse dell'utente.

## Direzione

- Agisci come Senior Product Designer e Frontend Engineer.
- Cerca la precisione e la semplicità di Apple, Linear e Vercel senza copiarne
  l'identità e senza produrre una generica interfaccia SaaS.
- Il risultato deve essere riconoscibile come True Design: essenziale,
  materico, elegante e contemporaneo.
- Claim principale: **Extraordinary. Everyday.**

## Identità e colore

- Usa il logo True ufficiale.
- Usa Suisse Int’l quando disponibile. Fallback:
  `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`.
- Le palette devono derivare dalle collezioni CMF di True Design.
- In ogni vista usa pochi colori: base neutra, tono materico e un accento.
- Preferisci rapporti tono su tono; evita colori primari puri, gradienti
  decorativi vistosi e combinazioni casuali.
- Il colore non deve essere l'unico mezzo per comunicare uno stato.

## Tipografia

- Mantieni una gerarchia netta e limita i pesi a 400, 500, 600 e 700.
- Usa tracking lievemente negativo sui titoli, senza compromettere la
  leggibilità. Indicativamente da `-0.02em` a `-0.045em`.
- Usa line-height compatte ma non compresse sui display title e generose sul
  testo corrente.
- Limita le righe di testo a circa 55–70 caratteri.
- Elimina descrizioni, label e microcopy che non aiutano una decisione.

## Griglia e spaziatura

- Usa una scala basata su 8px, con correzioni ottiche quando servono.
- Prediligi whitespace generoso, ma evita vuoti sproporzionati.
- Mantieni allineamenti rigorosi e container responsive.
- Non racchiudere automaticamente ogni contenuto in una card: usa anche
  sezioni aperte e divisori sottili.

## Superfici e card

- Preferisci superfici piatte, materiche e tono su tono.
- Bordi sottili e discreti; ombre morbide solo per livelli realmente
  sovrapposti.
- Evita glassmorphism marcato, blur decorativi e gradienti sulle card.
- Usa raggi coerenti, in genere da 12px a 24px.
- Le card delle app sono quadrate, interamente cliccabili e mostrano
  principalmente il titolo. Non aggiungere iniziali, badge “in evidenza” o
  pulsanti “Apri app” senza una ragione funzionale.

## Componenti e dipendenze

- Riusa per primi componenti, variabili e pattern già presenti.
- Non installare automaticamente shadcn/ui, Framer Motion, Lucide o librerie
  simili. Aggiungile solo quando risolvono una necessità concreta.
- Non usare emoji come icone di interfaccia.
- Se servono nuove icone, usa una famiglia monocromatica coerente con stroke
  sottile.

## Interazioni e accessibilità

- Ogni controllo deve avere stati hover, `focus-visible`, disabled, loading,
  successo ed errore quando applicabili.
- Mantieni un'area interattiva minima di 44×44px.
- Usa transizioni funzionali da 160 a 300ms e rispetta
  `prefers-reduced-motion`.
- Menu, popover e pannelli devono chiudersi cliccando all'esterno e premendo
  Escape.
- Preferisci feedback inline o toast accessibili ai popup di sistema.
- Mantieni contrasto WCAG AA, label reali e navigazione completa da tastiera.

## Responsive e dashboard

- Progetta desktop, tablet e mobile insieme; verifica overflow e breakpoint.
- Lo scorrimento orizzontale deve essere intenzionale e limitato a raccolte,
  carousel o tabelle che lo richiedono.
- Nelle aree amministrative privilegia chiarezza e densità controllata.
- KPI, grafici e tabelle devono essere leggibili senza decorazioni superflue.
- I grafici usano la palette True attiva e non colori casuali.
- Le azioni distruttive devono essere riconoscibili ma non dominanti.

## Verifica visiva obbligatoria

Prima di dichiarare conclusa una modifica UI, controlla almeno:

1. desktop e mobile;
2. gerarchia tipografica e tracking;
3. allineamenti e ritmo delle spaziature;
4. hover, focus, disabled e tastiera;
5. contrasto e leggibilità;
6. overflow e riduzione delle animazioni;
7. coerenza con logo, Suisse Int’l e palette CMF True.
