export type AppIconKey =
  | "search"
  | "tetris"
  | "calculator"
  | "conversation"
  | "computer"
  | "checklist";

const ICON_BY_URL: Record<string, AppIconKey> = {
  "/apps/analisi-competitor": "search",
  "/apps/true-tetris-pallet": "tetris",
  "/apps/true-generatore-offerte": "calculator",
  "/apps/prenotazione-sale-riunioni": "conversation",
  "/apps/true-sondaggio-iconici": "checklist",
  "/apps/archivio-pc": "computer",
};

export function getAppIconKey(url: string | null) {
  return url ? ICON_BY_URL[url] ?? null : null;
}

export function getAppDisplayName(name: string, url: string | null) {
  return url === "/apps/true-tetris-pallet" ? "Tetris Pallet" : name;
}

