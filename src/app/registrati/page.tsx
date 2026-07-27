"use client";

import { useState } from "react";
import Brand from "../_components/brand";
import { registerPendingUser } from "./actions";

export default function RegistrationPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await registerPendingUser({
      firstName,
      lastName,
      email,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setComplete(true);
  }

  return (
    <main className="registration-shell">
      <section className="registration-intro">
        <Brand context="workspace" />
        <div>
          <p className="eyebrow">Extraordinary. Everyday.</p>
          <h1>Il tuo spazio True, ogni giorno.</h1>
          <p>Registrati per accedere agli strumenti e ai servizi digitali dedicati.</p>
        </div>
        <span className="muted">True Design digital workspace</span>
      </section>

      <section className="registration-form-wrap">
        <div className="registration-card">
          {complete ? (
            <div className="registration-complete">
              <span aria-hidden="true">✓</span>
              <p className="eyebrow">Registrazione ricevuta</p>
              <h2>Richiesta inviata.</h2>
              <p className="muted">
                Dopo l’approvazione riceverai un link personale per scegliere la password,
                verificare l’indirizzo email e attivare il tuo spazio.
              </p>
              <a href="/" className="btn">Torna alla home →</a>
            </div>
          ) : (
            <>
              <p className="eyebrow">Crea account</p>
              <h2>Registrati</h2>
              <p className="muted">Dopo l’invio, l’amministratore approverà il profilo e assegnerà le applicazioni disponibili.</p>

              <form onSubmit={handleSubmit} className="grid registration-form">
                <div className="registration-name-grid">
                  <div>
                    <label className="muted" htmlFor="first-name">Nome</label>
                    <input id="first-name" className="input" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="muted" htmlFor="last-name">Cognome</label>
                    <input id="last-name" className="input" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="muted" htmlFor="registration-email">Email</label>
                  <input id="registration-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="error" role="alert">{error}</p>}
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Invio richiesta…" : "Invia la richiesta →"}
                </button>
              </form>
              <p className="registration-login-link">Hai già un account? <a href="/login?tipo=cliente">Accedi</a></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
