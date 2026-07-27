import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RootLayout", () => {
  it("non include controlli per cambiare la palette", () => {
    const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("PaletteSwitcher");
    expect(source).not.toContain("palette-switcher");
  });
});
