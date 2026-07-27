export default function HomeAppLink({ name, url }: { name: string; url: string }) {
  return (
    <a className="home-workspace-app" href={url}>
      <strong>{name}</strong>
    </a>
  );
}
