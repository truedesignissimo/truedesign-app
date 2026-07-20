"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const tipo = searchParams.get("tipo") === "interno" ? "interno" : "cliente";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      setError("Credenziali non valide. Riprova.");
      return;
    }

    // Verifica che il tipo di accesso scelto corrisponda al profilo,
    // a meno che l'utente non sia admin (che passa sempre)
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, is_admin")
      .eq("id", data.user.id)
      .single();

    if (!profile?.is_admin && profile?.user_type && profile.user_type !== tipo) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        tipo === "interno"
          ? "Questo accesso e' riservato agli utenti interni True Design."
          : "Questo accesso e' riservato ai clienti."
      );
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: "1.4rem" }}>True App</h1>
        <p className="muted">
          {tipo === "interno"
            ? "Accesso utenti interni True Design."
            : "Accesso clienti."}{" "}
          Accedi con le credenziali fornite dall'amministratore.
        </p>

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

        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
          <a href="/">← Torna alla home</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
