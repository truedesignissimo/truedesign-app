import Brand from "../_components/brand";
import { createAdminClient } from "@/lib/supabase-admin";
import { resolveApprovalSecret, verifyApprovalToken } from "@/lib/approval-token";
import { getApprovalPageState } from "./approval-page-state";
import { approveUserFromEmail } from "./actions";

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token = "", status } = await searchParams;
  const messages: Record<string, { title: string; text: string }> = {
    approved: {
      title: "Utente approvato.",
      text: "Tutte le app attive sono state assegnate e la mail è stata inviata.",
    },
    "already-approved": {
      title: "Utente già attivo.",
      text: "Non sono state create assegnazioni duplicate.",
    },
    "approved-email-pending": {
      title: "Utente approvato.",
      text: "L'account è attivo, ma la mail non è partita. Puoi reinviarla dalla console.",
    },
    expired: { title: "Link scaduto.", text: "Questo link non può più approvare l'utente." },
    invalid: { title: "Link non valido.", text: "Controlla di aver aperto il link completo." },
  };
  const resultMessage = status ? messages[status] : null;
  const verified = verifyApprovalToken(token, resolveApprovalSecret());
  const state = getApprovalPageState(verified);

  let account: { fullName: string; email: string } | null = null;
  if (state.kind === "ready" && !resultMessage) {
    const admin = createAdminClient();
    const [{ data: authData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(state.userId),
      admin.from("profiles").select("full_name").eq("id", state.userId).maybeSingle(),
    ]);
    if (authData.user?.email) {
      account = {
        email: authData.user.email,
        fullName: profile?.full_name || authData.user.email,
      };
    }
  }

  return (
    <main className="approval-shell">
      <section className="approval-card">
        <Brand context="workspace" />
        {resultMessage ? (
          <>
            <p className="eyebrow">Registrazioni</p>
            <h1>{resultMessage.title}</h1>
            <p className="muted">{resultMessage.text}</p>
            <a className="btn" href="/">Torna al sito</a>
          </>
        ) : state.kind !== "ready" || !account ? (
          <>
            <p className="eyebrow">Registrazioni</p>
            <h1>{state.title}</h1>
            <p className="muted">La richiesta non può essere completata.</p>
          </>
        ) : (
          <>
            <p className="eyebrow">Nuova richiesta</p>
            <h1>Approva questo utente.</h1>
            <div className="approval-summary">
              <strong>{account.fullName}</strong>
              <span>{account.email}</span>
            </div>
            <p className="muted">L'utente riceverà tutte le app attive e la conferma via email.</p>
            <form action={approveUserFromEmail.bind(null, token)}>
              <button className="btn" type="submit">Approva e assegna tutte le app</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
