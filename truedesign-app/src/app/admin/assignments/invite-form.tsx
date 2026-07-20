"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "./actions";

export default function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await inviteUser(email, fullName);
      setEmail("");
      setFullName("");
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Errore durante l'invito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid" style={{ gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }}>
      <div>
        <label className="muted">Nome</label>
        <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="muted">Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "..." : "Invita"}
      </button>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
      {success && <p className="muted" style={{ gridColumn: "1 / -1" }}>Invito inviato via email.</p>}
    </form>
  );
}
