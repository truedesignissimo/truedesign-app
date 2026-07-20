"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Brand from "../_components/brand";

export default function RegistrationPage() {
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
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
              <p className="eyebrow">Registrazione completata</p>
              <h2>Controlla la tua email.</h2>
              <p className="muted">
                Ti abbiamo inviato il link per confermare l’account. Dopo la conferma potrai accedere al workspace.
              </p>
              <a href="/login?tipo=cliente" className="btn">Vai all’accesso →</a>
            </div>
          ) : (
            <>
              <p className="eyebrow">Crea account</p>
              <h2>Registrati</h2>
              <p className="muted">I campi contrassegnati sono necessari per creare il tuo profilo.</p>

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
                <div>
                  <label className="muted" htmlFor="registration-password">Password</label>
                  <input id="registration-password" className="input" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <span className="field-help">Almeno 8 caratteri.</span>
                </div>
                {error && <p className="error" role="alert">{error}</p>}
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Creazione account…" : "Crea il mio account →"}
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
