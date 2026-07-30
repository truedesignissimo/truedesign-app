import { describe, expect, it } from "vitest";
import { getAppDisplayName, getAppIconKey } from "./app-icon-model";

describe("app icon mapping", () => {
  it.each([
    ["/apps/analisi-competitor", "search"],
    ["/apps/true-tetris-pallet", "tetris"],
    ["/apps/true-generatore-offerte", "calculator"],
    ["/apps/prenotazione-sale-riunioni", "conversation"],
    ["/apps/true-sondaggio-iconici", "checklist"],
  ] as const)("maps %s to %s", (url, icon) => {
    expect(getAppIconKey(url)).toBe(icon);
  });

  it("returns no icon for an unknown or missing app URL", () => {
    expect(getAppIconKey("/apps/unknown")).toBeNull();
    expect(getAppIconKey(null)).toBeNull();
  });
});

describe("app display names", () => {
  it("removes True from Tetris Pallet independently of the catalog value", () => {
    expect(
      getAppDisplayName("True Tetris Pallet", "/apps/true-tetris-pallet")
    ).toBe("Tetris Pallet");
  });

  it("keeps every other app name unchanged", () => {
    expect(
      getAppDisplayName("Generatore Offerte", "/apps/true-generatore-offerte")
    ).toBe("Generatore Offerte");
  });
});
