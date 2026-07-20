"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Credenziali non valide. Riprova.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: "1.4rem" }}>True App</h1>
        <p className="muted">Accedi con le credenziali fornite dall'amministratore.</p>

        <form onSubmit={handleLogin} className="grid" style={{ marginTop: "1rem" }}>
          <div>
            <label className="muted">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="muted">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
