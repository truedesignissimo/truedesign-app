# Assegnazioni utenti, dashboard e reportistica

## Obiettivo

Rendere affidabili e comprensibili:

- le assegnazioni delle app per ruolo e per singolo utente;
- la visualizzazione delle app nella dashboard;
- il nome di battesimo mostrato nel saluto;
- la registrazione dei login e delle aperture delle app;
- la presentazione grafica delle card applicazione.

Il valore database `cliente` e la dicitura **Cliente** restano invariati.

## Regole di assegnazione

`user_apps` resta la fonte effettiva delle autorizzazioni.

- Un utente **Team interno** riceve tutte le app attive.
- Un utente **Cliente** riceve di default soltanto l’app con URL
  `/apps/true-sondaggio-iconici`.
- L’approvazione di un nuovo utente applica il set previsto dal suo ruolo.
- Il cambio di ruolo sostituisce le assegnazioni con il set predefinito del
  nuovo ruolo.
- Le checkbox consentono poi eccezioni manuali.
- **Assegna tutte** assegna tutte le app attive.
- **Escludi tutte** elimina tutte le assegnazioni.

Le operazioni usano inserimenti idempotenti per evitare errori di chiave
duplicata. Il pannello aggiorna lo stato locale solo dopo una risposta valida,
oppure ripristina con precisione lo stato precedente.

## Lettura della dashboard

Dopo avere verificato la sessione, la dashboard legge profilo, catalogo e
assegnazioni lato server con il client amministrativo. In questo modo la
visibilità delle app non dipende dalle policy RLS applicate al client browser,
mentre l’utente può leggere esclusivamente le proprie assegnazioni perché
l’identificativo deriva dalla sessione verificata e non da un parametro.

Gli amministratori continuano a vedere tutte le app attive.

## Nome visualizzato

Una funzione condivisa ricava il nome di battesimo con questo ordine:

1. `profiles.full_name`;
2. `auth.user_metadata.first_name`;
3. prima parola di `auth.user_metadata.full_name`;
4. parte locale dell’email solo come ultima emergenza.

La dashboard mostra per tutti `Ciao, Nome.`. Quando il profilo non contiene
ancora il nome ma Auth sì, il nome corretto viene comunque visualizzato.

## Card applicazione

La card conserva il formato verticale e il titolo interno in basso.

- L’icona è centrata geometricamente rispetto all’intera superficie.
- L’icona è più grande dell’attuale, mantenendo margini sicuri.
- Titolo, hover, focus e palette restano coerenti con il design system True.
- Desktop e mobile mantengono lo stesso centro ottico e nessun overflow.

## Registrazione dell’attività

Le attività vengono distinte in due flussi:

### Accessi al workspace

Una nuova tabella `access_log` registra un evento dopo ogni login riuscito,
sia dal form principale sia dal form in homepage. Contiene almeno:

- `id`;
- `user_id`;
- `accessed_at`;
- origine del login (`homepage` o `login`).

La scrittura avviene lato server attraverso un’azione autenticata. L’ID utente
è ricavato dalla sessione, mai accettato dal browser. Non vengono salvati
indirizzi IP, user-agent o altri dati tecnici non necessari.

### Aperture delle app

`usage_log` continua a registrare una riga per ogni navigazione reale verso
una pagina `/apps/...`. Prefetch, richieste RSC, asset e chiamate API non
vengono conteggiati. La scrittura avviene con privilegi server dopo la
verifica dell’accesso all’app.

## Reportistica

La pagina amministrativa separa chiaramente:

- login al workspace;
- aperture complessive delle app;
- utenti che hanno effettuato almeno un login;
- utenti che hanno realmente aperto app;
- dettaglio cronologico dei login;
- dettaglio cronologico delle aperture;
- conteggi per utente e per applicazione.

I nomi sono risolti dai profili e le email da Supabase Auth. Gli errori di
lettura non vengono trasformati silenziosamente in “zero”: la pagina mostra
un messaggio amministrativo esplicito.

## Errori e coerenza

- Il cambio ruolo aggiorna profilo e assegnazioni come un’unica operazione
  logica; se il riallineamento fallisce, il pannello comunica l’errore e
  ripristina lo stato precedente.
- Le operazioni massive hanno stato loading e disabilitano temporaneamente i
  controlli dello stesso utente.
- Gli errori server vengono convertiti in messaggi italiani comprensibili,
  senza mostrare il generico errore React Server Components.

## Verifica

Test automatici:

- set predefinito Team interno;
- set predefinito Cliente;
- cambio ruolo;
- assegnazione idempotente;
- assegna/escludi tutte;
- risoluzione del nome;
- registrazione login autenticata;
- filtro delle sole navigazioni app reali;
- aggregazioni della reportistica.

Verifica manuale:

- amministratore e utente normale;
- Cliente e Team interno;
- dashboard con assegnazioni reali;
- login da homepage e pagina login;
- apertura di almeno due app con due utenti distinti;
- report aggiornato;
- card desktop e mobile, hover, focus e tastiera.
