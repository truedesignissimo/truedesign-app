import { describe, expect, it } from "vitest";
import { ADMIN_NAV_ITEMS } from "./navigation";

describe("ADMIN_NAV_ITEMS", () => {
  it("espone una tab dedicata ai risultati del sondaggio iconici", () => {
    expect(ADMIN_NAV_ITEMS).toContainEqual({
      href: "/admin/apps/true-sondaggio-iconici",
      label: "Risultati sondaggio",
      emphasis: true,
    });
  });

  it("mantiene un solo collegamento per ciascuna destinazione", () => {
    const destinations = ADMIN_NAV_ITEMS.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
  });
});
