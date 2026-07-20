export default function Brand({ context = "workspace" }: { context?: string }) {
  return (
    <a href="/" className="brand" aria-label="True Design, torna alla home">
      <img
        className="brand-logo"
        src="/Assets/Logo%20True.png"
        alt="True Design"
      />
      <span className="brand-context">{context}</span>
    </a>
  );
}
