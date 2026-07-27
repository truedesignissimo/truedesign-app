import { describe, expect, it } from "vitest";
import { getHomeHeroLinks } from "./home-hero-actions-model";

describe("home hero actions", () => {
  it("mostra accesso e registrazione agli anonimi", () => {
    expect(getHomeHeroLinks(false)).toEqual([
      { href: "/login", label: "Accedi" },
      { href: "/registrati", label: "Registrati" },
    ]);
  });

  it("non mostra CTA anonimi a un utente autenticato", () => {
    expect(getHomeHeroLinks(true)).toEqual([]);
  });
});
