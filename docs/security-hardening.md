# Sicurezza truedesign.app

Ultimo controllo: 21 luglio 2026.

## Verificato e applicato

- Password gestite da Supabase Auth e salvate con bcrypt, non MD5/SHA-1.
- Chiavi `service_role`, Resend e altri segreti usati esclusivamente nel codice server.
- Route `/admin`, `/dashboard` e app interne protette anche da accesso anonimo diretto.
- Offerte commerciali isolate per `user_id` con Row Level Security per lettura, inserimento, modifica ed eliminazione.
- Immagini delle offerte in bucket privato con cartella per utente, allowlist JPEG/PNG/WebP, limite 10 MB e nome casuale.
- Invio sondaggio irrigidito con controllo origine, formato e dimensione, honeypot e allowlist dei link prodotto.
- Notifica registrazione protetta da contenuto HTML iniettato nel nome o nell'email.
- Header HTTP globali: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, Referrer Policy e Permissions Policy.
- Header `X-Powered-By` disabilitato.
- Cookie Supabase marcati `Secure` in produzione; `SameSite=Lax` mantenuto per i callback Auth.
- Nessuna esposizione pubblica rilevata per `.env`, `.env.local`, `.git/config`, `phpinfo.php` o dump SQL comuni.
- Dipendenze di produzione: `npm audit` senza vulnerabilità note.
- TLS 1.2 e TLS 1.3 verificati, certificati validi per dominio con e senza `www`.

## Da pianificare

### Priorità alta

1. MFA TOTP obbligatoria per gli amministratori, con controllo AAL2 sia nelle pagine admin sia nelle policy dati.
2. Rate limit distribuito per login e endpoint pubblici: 5 tentativi iniziali, poi attesa progressiva. Usare Supabase Auth Rate Limits più Vercel WAF o un archivio condiviso; un contatore in memoria non è affidabile su serverless.
3. Test IDOR end-to-end con due account di prova sul database di produzione/staging, per confermare le policy live oltre alle migration già revisionate.

### Priorità media

4. CSP con nonce, per eliminare gradualmente `unsafe-inline` senza rompere Next.js e l'app Tetris incorporata.
5. Requisiti password Supabase più forti e controllo password compromesse, verificando disponibilità e impatto sul piano corrente.
6. Scansione passiva OWASP ZAP automatizzata in CI/staging. ZAP non è installato sulla macchina usata per questo controllo.
7. Rieseguire SecurityHeaders e SSL Labs dopo il deploy degli header. SSL Labs non ha assegnato un voto durante questo controllo per un errore di comunicazione con gli endpoint Vercel; la verifica TLS manuale è riuscita.

### Nota architetturale

`@supabase/ssr` mantiene intenzionalmente il cookie Auth accessibile al client (`HttpOnly: false`) e usa `SameSite=Lax`. Portarlo a `HttpOnly + Strict` richiede un'architettura Backend-for-Frontend e la rimozione dell'accesso Supabase diretto dal browser; non va cambiato come semplice flag perché interromperebbe refresh di sessione e callback email.

Il nome del percorso amministratore non è considerato una misura di sicurezza: autorizzazione server-side, MFA e policy dati sono i controlli effettivi.
