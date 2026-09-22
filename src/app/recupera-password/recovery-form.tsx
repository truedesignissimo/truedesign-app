"use client";

import { useState } from "react";
import { requestPasswordRecoveryFromEmail } from "./actions";

export default function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    await requestPasswordRecoveryFromEmail(email);
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="registration-complete" aria-live="polite">
        <span aria-hidden="true">✓</span>
        <p className="eyebrow">Controlla la tua email</p>
        <h2>Sei quasi pronto.</h2>
        <p className="muted">Se esiste un account attivo per questo indirizzo, riceverai a breve un’email per reimpostare la password.</p>
        <a className="btn" href="/login">Torna all’accesso →</a>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">Recupera l’accesso</p>
      <h2>Hai dimenticato la password?</h2>
      <p className="muted">Inserisci il tuo indirizzo email e ti invieremo le istruzioni per sceglierne una nuova.</p>
      <form className="grid registration-form" onSubmit={handleSubmit}>
        <div>
          <label className="muted" htmlFor="recovery-email">Email</label>
          <input
            id="recovery-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="nome@azienda.it"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Invio in corso…" : "Invia il link →"}
        </button>
      </form>
      <a href="/login" className="login-back">← Torna all’accesso</a>
    </>
  );
}
