import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("login links", () => {
  it("mostra registrazione e recupero password in un'unica riga", async () => {
    const page = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

    expect(page).toContain('href="/registrati">Crea nuovo account</a>');
    expect(page).toContain('href="/recupera-password">Recupero password</a>');
    expect(page).not.toContain("← Torna alla scelta dell’area");
  });
});
