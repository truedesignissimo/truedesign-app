import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Brand from "../_components/brand";
import PasswordForm from "./password-form";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?errore=link-non-valido");

  return (
    <main className="registration-shell">
      <section className="registration-intro">
        <Brand context="workspace" />
        <div>
          <p className="eyebrow">Extraordinary. Everyday.</p>
          <h1>Benvenuto nel tuo spazio True.</h1>
          <p>Completa l’attivazione e accedi agli strumenti che ti sono stati assegnati.</p>
        </div>
        <span className="muted">True Design digital workspace</span>
      </section>
      <section className="registration-form-wrap">
        <div className="registration-card">
          <PasswordForm />
        </div>
      </section>
    </main>
  );
}
