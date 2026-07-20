export default function Brand({ context = "digital workspace" }: { context?: string }) {
  return (
    <a href="/" className="brand" aria-label="True, torna alla home">
      <span className="brand-word">
        true<span className="brand-dot">.</span>
      </span>
      <span className="brand-context">{context}</span>
    </a>
  );
}
