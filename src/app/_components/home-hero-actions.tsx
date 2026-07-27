import { getHomeHeroLinks } from "./home-hero-actions-model";

export default function HomeHeroActions({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const links = getHomeHeroLinks(isAuthenticated);
  if (links.length === 0) return null;

  return (
    <nav className="home-hero-actions" aria-label="Accesso al workspace">
      {links.map((link) => (
        <a key={link.href} href={link.href}>{link.label}</a>
      ))}
    </nav>
  );
}
