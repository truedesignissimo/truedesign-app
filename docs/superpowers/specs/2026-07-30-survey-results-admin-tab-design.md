# Tab amministrativa “Risultati sondaggio”

## Obiettivo

Rendere la dashboard già disponibile in
`/admin/apps/true-sondaggio-iconici` immediatamente raggiungibile dalla
navigazione principale dell’amministrazione.

## Soluzione

- Centralizzare le voci della navigazione amministrativa in una configurazione
  tipizzata.
- Aggiungere la voce `Risultati sondaggio`, collegata alla pagina esistente.
- Evidenziare la voce con un trattamento tono su tono coerente con il design
  system, mantenendo gli stessi stati di focus e hover degli altri controlli.
- Continuare a proteggere la pagina tramite `src/app/admin/layout.tsx`: utenti
  anonimi e non amministratori non possono raggiungere né la tab né i dati.

## Dati

Non viene introdotta alcuna nuova query. La pagina esistente continua a leggere
`survey_iconic_responses` tramite il client Supabase amministrativo e a mostrare
totale, ultima risposta, classifica, percentuali e risposte individuali ordinate
dalla più recente.

Non vengono usati `risultati.php`, CSV o URL di `dariobreggie.it`.

## Verifica

- Test automatico sulla presenza e unicità della nuova destinazione.
- Suite completa, typecheck e build di produzione.
- Controllo responsive della navigazione amministrativa.
