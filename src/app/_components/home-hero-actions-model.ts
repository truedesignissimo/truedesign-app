export function getHomeHeroLinks(isAuthenticated: boolean) {
  return isAuthenticated
    ? []
    : [
        { href: "/login", label: "Accedi" },
        { href: "/registrati", label: "Registrati" },
      ];
}
