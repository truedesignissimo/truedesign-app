import Brand from "../_components/brand";
import RecoveryForm from "./recovery-form";

export default function PasswordRecoveryPage() {
  return (
    <main className="registration-shell">
      <section className="registration-intro">
        <Brand context="workspace" />
        <div>
          <p className="eyebrow">Extraordinary. Everyday.</p>
          <h1>Il tuo spazio resta tuo.</h1>
          <p>Recupera l’accesso agli strumenti che True Design ha preparato per te.</p>
        </div>
        <span className="muted">True Design digital workspace</span>
      </section>
      <section className="registration-form-wrap">
        <div className="registration-card">
          <RecoveryForm />
        </div>
      </section>
    </main>
  );
}
