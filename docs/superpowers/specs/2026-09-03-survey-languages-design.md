# Sondaggio multilingua e gestione affidabile

Approvazione: il proprietario ha trasferito qui il prompt completo della chat
Sondaggio prodotti iconici e chiesto di procedere il 3 settembre 2026.
Unica attività attiva: Truedesign.app. L'altra attività è ferma, senza modifiche.

## Base e conservazione

Base aggiornata: origin/main a541bc0; cartella riallineata sul branch
codex/sondaggio-multilingua. I file dell'automazione sono già salvati nel branch
codex/supabase-migrations-automation e nello stash di sicurezza nominato
Safety copy automation before survey consolidation 2026-09-03.
Non cancellare rami o modifiche estranee. Baseline: 171 test e typecheck passati.

## Interfaccia

Tre pulsanti 🇮🇹 Italiano, 🇬🇧 English, 🇫🇷 Français; bandiere richieste
esplicitamente dal proprietario come eccezione al divieto di emoji decorative.
Traduzioni locali tipizzate: non introdurre librerie/global routing i18n, né
duplicare tre pagine. Questa soluzione mantiene l'app isolata e riusa il layout.
Priorità lingua: parametro URL valido lang, preferenza locale valida, italiano.
La scelta aggiorna URL e preferenza senza ricaricare o perdere le selezioni.
Tutti i testi pubblici e i messaggi di successo/errore sono tradotti, incluse
label accessibili e titolo pagina. I nomi dei prodotti rimangono invariati.
Nessun invio email esiste nell'app né nei trigger verificati: non inventare
un nuovo flusso email e non cambiare la registrazione generale del sito.

Restano esattamente 10 scelte. Un feedback breve sulla tessera attivata mostra
quante scelte restano, senza spostare il layout; stesso conteggio annunciato
in una regione live. Ridurre/eliminare il movimento quando richiesto dal sistema.
Disabilitare modifica delle scelte durante l'invio; mantenere i dati in caso
di errore e mostrare messaggi sicuri nella lingua attuale.

## Risposte e archivio

Eliminare una singola risposta corrente solo dopo conferma esplicita con
nome/data e controllo amministratore server-side. Ricalcolare viste ed Excel
dal database; gli archivi restano fotografie indipendenti.

Verifica live: tabelle/funzioni archivio assenti; 11 risposte reali rilevate
dall'altra attività. Non usarle nei test distruttivi. La migrazione esistente
ha un rischio tra copia e DELETE: nuovi voti potrebbero essere cancellati.
Nuova migrazione autonoma e retrocompatibile: crea le strutture mancanti e
sostituisce le funzioni con lock coerenti prima di conteggio/copia/cancellazione.
Tutte le operazioni devono restare transazionali e accessibili solo al service_role
attraverso controlli amministratore. Nessun reset automatico dei dati reali.

## Verifica e consegna

Test-first delle traduzioni, errori API, conteggio, conferme e autorizzazioni.
Test SQL isolati e reversibili; visual QA desktop/mobile/tastiera/reduced-motion.
Test completi, typecheck e build. Pubblicazione selettiva del solo sondaggio;
verificare live UI, catalogo e schema prima di dichiarare completamento.
Non includere il workflow non autorizzato né usare credenziali alternative.
