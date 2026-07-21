"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirmation) {
      setError("Le due password non coincidono.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Non è stato possibile impostare la password. Il link potrebbe essere scaduto.");
      return;
    }

    setComplete(true);
  }

  if (complete) {
    return (
      <div className="registration-complete">
        <span aria-hidden="true">✓</span>
        <p className="eyebrow">Account attivato</p>
        <h2>Password impostata.</h2>
        <p className="muted">Il tuo accesso al workspace True Design è pronto.</p>
        <a className="btn" href="/dashboard">Entra nel workspace →</a>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">Ultimo passaggio</p>
      <h2>Crea la tua password</h2>
      <p className="muted">Scegli una password personale per completare l’attivazione dell’account.</p>
      <form className="grid registration-form" onSubmit={handleSubmit}>
        <div>
          <label className="muted" htmlFor="new-password">Nuova password</label>
          <input
            id="new-password"
            className="input"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="field-help">Almeno 8 caratteri.</span>
        </div>
        <div>
          <label className="muted" htmlFor="confirm-password">Conferma password</label>
          <input
            id="confirm-password"
            className="input"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Salvataggio…" : "Imposta password →"}
        </button>
      </form>
    </>
  );
}
