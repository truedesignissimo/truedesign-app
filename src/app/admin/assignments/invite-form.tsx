"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "./actions";

export default function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"cliente" | "interno">("cliente");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await inviteUser(email, fullName, userType);
      setEmail("");
      setFullName("");
      setUserType("cliente");
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Errore durante l'invito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid form-grid-invite form-grid-invite-wide">
      <div>
        <label className="muted">Nome</label>
        <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="muted">Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="muted">Tipo di accesso</label>
        <select
          className="input"
          value={userType}
          onChange={(e) => setUserType(e.target.value as "cliente" | "interno")}
        >
          <option value="cliente">Cliente</option>
          <option value="interno">Team interno</option>
        </select>
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Invio…" : "Invia invito"}
      </button>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
      {success && <p className="success" style={{ gridColumn: "1 / -1" }}>Invito inviato via email.</p>}
    </form>
  );
}
