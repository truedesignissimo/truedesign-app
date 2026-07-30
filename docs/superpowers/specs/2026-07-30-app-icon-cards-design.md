# App icon cards — design

## Obiettivo

Sostituire le attuali card solo testuali con card verticali riconoscibili, usando
il set di cinque icone fornito da True Design e mantenendo il nome dell’app
all’interno della card.

## Mappatura

- `/apps/analisi-competitor` → ricerca
- `/apps/true-tetris-pallet` → Tetris
- `/apps/true-generatore-offerte` → calcolatrice
- `/apps/prenotazione-sale-riunioni` → conversazione
- `/apps/true-sondaggio-iconici` → checklist

La mappatura dipende dall’URL, non dal nome modificabile nel catalogo.

## Aspetto e comportamento

- Card con rapporto verticale `4 / 5`, bordi arrotondati e superficie piatta.
- Icona monocromatica centrata, larga circa il 54–60% della card.
- Nome dell’app dentro la card, sotto l’icona, con tipografia Suisse Int’l.
- Hover e focus: sfondo `#302515`; icona e titolo assumono il giallo della
  palette (`var(--accent-soft)`).
- Transizione funzionale da 220 ms e rispetto di `prefers-reduced-motion`.
- La card resta interamente cliccabile e conserva un’area interattiva ampia.
- Lo stesso componente è usato in homepage, dashboard e pagina app pubbliche.

## Rinomina

L’app `/apps/true-tetris-pallet` viene visualizzata come **Tetris Pallet**.
Il titolo della pagina e del documento incorporato vengono aggiornati; una
migrazione aggiorna anche il record del catalogo Supabase.

## Verifica

- Test automatico della mappatura URL → icona e della normalizzazione del nome.
- Typecheck, suite test e build.
- Controllo visivo desktop e mobile di homepage, dashboard e pagina pubblica.

