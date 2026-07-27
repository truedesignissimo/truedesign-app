export default function AppLink({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  if (!url) {
    return (
      <div className="app-title-card app-title-card-disabled" aria-disabled="true">
        <h2>{name}</h2>
      </div>
    );
  }

  return (
    <a className="app-title-card" href={url}>
      <h2>{name}</h2>
    </a>
  );
}
