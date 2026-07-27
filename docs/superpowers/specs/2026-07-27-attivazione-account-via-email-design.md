# Attivazione account via email

## Obiettivo

Rendere la registrazione semplice, ripetibile e sicura:

- il form pubblico chiede nome, cognome ed email, senza password;
- la richiesta compare subito nel pannello amministratore;
- l'amministratore riceve una notifica con il link di approvazione;
- dopo l'approvazione, l'utente riceve una email True Design e sceglie la
  password tramite un link personale;
- il clic sul link costituisce la verifica dell'indirizzo email;
- una richiesta già in attesa può essere reinviata senza mostrare
  erroneamente "account esistente".

## Flusso

### Registrazione pubblica

1. Il server normalizza e valida nome, cognome ed email.
2. Se l'email non esiste, crea un'identità Supabase con una password casuale
   non comunicata, `email_confirm = false` e un profilo `pending`.
3. Se l'identità esiste già ed è ancora `pending`, aggiorna nome e profilo e
   tratta l'invio come una ripetizione della stessa richiesta.
4. Se l'identità è già approvata, invita l'utente ad accedere o recuperare la
   password, senza modificare l'account.
5. Invia a `dario.breggie@truedesign.it` la notifica di approvazione. La stessa
   richiesta pending può quindi reinviare la notifica.

### Esito dell'invio email

L'invio non deve più fallire silenziosamente:

- configurazione mancante o risposta negativa di Resend vengono registrate
  lato server senza includere dati sensibili;
- il form distingue "richiesta e notifica inviate" da "richiesta salvata ma
  notifica non partita";
- in quest'ultimo caso un nuovo invio recupera la richiesta pending e ritenta
  la notifica, senza creare duplicati.

### Approvazione e opt-in

1. Il link amministrativo firmato apre la pagina di conferma; il `GET` non
   approva automaticamente.
2. Il `POST` assegna tutte le app attive e approva il profilo in modo
   idempotente.
3. Supabase genera un link monouso di tipo `recovery` diretto alla pagina
   `/imposta-password`.
4. Resend invia all'utente l'email True Design con quel link.
5. L'utente apre il link, sceglie la password e completa la verifica
   dell'indirizzo. La password casuale iniziale non viene mai mostrata.

## Sicurezza

- I token di approvazione restano firmati e scadono dopo 72 ore.
- La chiave Supabase `service_role` e la chiave Resend restano solo sul server.
- Non si conferma più l'email lato server prima dell'opt-in dell'utente.
- Le risposte pubbliche non rivelano dettagli di account approvati oltre
  all'invito ad accedere o recuperare la password.
- Le richieste duplicate pending sono idempotenti e non creano nuove identità.

## Verifica

- test della prima registrazione senza password;
- test del reinvio per un account pending;
- test di rifiuto per un account già approvato;
- test dell'errore esplicito quando Resend non è configurato o fallisce;
- test della generazione del link monouso e dell'email di attivazione;
- test completi, typecheck, build e audit;
- prova in produzione con un indirizzo nuovo e con uno cancellato dal pannello.
