"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Brand from "../_components/brand";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const tipo = searchParams.get("tipo") === "interno" ? "interno" : "cliente";
  const isInternal = tipo === "interno";

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
      setError("Credenziali non valide. Controlla email e password e riprova.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, is_admin, approval_status")
      .eq("id", data.user.id)
      .single();

    if (!profile?.is_admin && profile?.user_type && profile.user_type !== tipo) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        isInternal
          ? "Questo accesso è riservato agli utenti interni True Design."
          : "Questo accesso è riservato ai clienti."
      );
      return;
    }

    if (profile?.approval_status === "pending" || profile?.approval_status === "rejected") {
      setLoading(false);
      router.push("/in-attesa");
      router.refresh();
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <section className="login-story">
        <Brand context="digital workspace" />
        <div className="login-story-copy">
          <p className="eyebrow">Accesso riservato</p>
          <h1>{isInternal ? "Bentornato nel tuo spazio." : "Il progetto continua qui."}</h1>
          <p>
            {isInternal
              ? "Accedi agli strumenti digitali pensati per rendere più fluido il lavoro del team True Design."
              : "Accedi a strumenti, configuratori e contenuti che True Design ha preparato per te."}
          </p>
        </div>
        <span className="muted">Extraordinary. Everyday.</span>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">{isInternal ? "Team True" : "Area clienti"}</p>
          <h2>Accedi</h2>
          <p className="muted">Usa le tue credenziali oppure crea un nuovo account.</p>

          <form onSubmit={handleLogin} className="grid">
            <div>
              <label className="muted" htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="nome@azienda.it"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="muted" htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="La tua password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Accesso in corso…" : "Entra nel workspace →"}
            </button>
          </form>

          <a href="/" className="login-back">← Torna alla scelta dell’area</a>
          {tipo === "cliente" && (
            <p className="registration-login-link">
              Non hai ancora un account? <a href="/registrati">Registrati</a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
