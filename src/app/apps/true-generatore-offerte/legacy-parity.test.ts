import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const generatorSource = readFileSync(new URL("./offer-generator.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("./offer-generator.module.css", import.meta.url), "utf8");

describe("official V3 structural parity", () => {
  it.each(["client", "search", "lines", "archive"])("renders the %s section", (name) => {
    expect(generatorSource).toContain(`data-v3-section=\"${name}\"`);
  });

  it("uses the official visual tokens and Suisse font", () => {
    expect(cssSource).toMatch(/--tt-cream:\s*#f5f2ec/);
    expect(cssSource).toMatch(/--tt-gold:\s*#a98b56/);
    expect(cssSource).toContain("font-family:'Suisse Intl'");
  });

  it("does not expose AI image generation controls", () => {
    expect(generatorSource).not.toMatch(/Genera immagine|Gemini|OpenAI/);
  });
});
