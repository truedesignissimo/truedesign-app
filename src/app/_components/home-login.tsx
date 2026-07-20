"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function HomeLogin({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setLoading(false);
      setError("Email o password non corretti.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", data.user.id)
      .maybeSingle();

    setLoading(false);
    router.push(profile?.approval_status === "pending" || profile?.approval_status === "rejected" ? "/in-attesa" : "/dashboard");
    router.refresh();
  }

  if (isAuthenticated) {
    return (
      <div className="home-login-ready">
        <span>Sessione attiva</span>
        <h3>Il tuo spazio è pronto.</h3>
        <a className="home-login-submit" href="/dashboard">Vai alle tue app <span>↗</span></a>
      </div>
    );
  }

  return (
    <form className="home-login-form" onSubmit={handleLogin}>
      <div className="home-login-field">
        <label htmlFor="home-email">Email</label>
        <input
          id="home-email"
          type="email"
          autoComplete="email"
          placeholder="nome@azienda.it"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="home-login-field">
        <label htmlFor="home-password">Password</label>
        <input
          id="home-password"
          type="password"
          autoComplete="current-password"
          placeholder="La tua password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && <p className="home-login-error" role="alert">{error}</p>}
      <button className="home-login-submit" type="submit" disabled={loading}>
        {loading ? "Accesso…" : "Entra nel tuo spazio"} <span>↗</span>
      </button>
      <div className="home-login-meta">
        <a href="/registrati">Crea un account</a>
        <a href="/login">Problemi di accesso?</a>
      </div>
    </form>
  );
}
