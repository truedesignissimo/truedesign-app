export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/apps", label: "Applicazioni" },
  { href: "/admin/assignments", label: "Utenti" },
  { href: "/admin/usage", label: "Utilizzo" },
  {
    href: "/admin/apps/true-sondaggio-iconici",
    label: "Risultati sondaggio",
    emphasis: true,
  },
] as const;
