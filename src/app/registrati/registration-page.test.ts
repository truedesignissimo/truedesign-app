import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("registration page", () => {
  it("non chiede né invia una password prima dell'approvazione", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(source).not.toContain('id="registration-password"');
    expect(source).not.toContain('type="password"');
    expect(source).not.toContain("setPassword");
    expect(source).not.toContain("password:");
  });

  it("spiega che la password verrà scelta dal link di attivazione", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(source).toContain("link personale");
    expect(source).toContain("scegliere la password");
  });
});
