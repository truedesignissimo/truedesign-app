import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const generatorSource = readFileSync(new URL("./offer-generator.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("./offer-generator.module.css", import.meta.url), "utf8");
const optionalSource = (path: string): string => {
  try {
    return readFileSync(new URL(path, import.meta.url), "utf8");
  } catch {
    return "";
  }
};
const formSource = [
  generatorSource,
  optionalSource("./components/customer-details.tsx"),
  optionalSource("./components/commercial-options.tsx"),
].join("\n");
const lineSource = [
  optionalSource("./components/offer-lines.tsx"),
  optionalSource("./components/product-configurator.tsx"),
  optionalSource("./components/product-search.tsx"),
].join("\n");

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
    expect(`${generatorSource}\n${lineSource}`).not.toMatch(/Genera immagine|Apri tool immagine|Gemini|OpenAI/);
  });

  it("restores the official commercial table and custom upload", () => {
    [
      "Codice", "Immagine", "Nome", "Configurazione", "Qta", "Categoria",
      "Prezzo listino", "Sconto %", "Sovrapprezzo", "Totale Riga",
      "Carica immagine",
    ].forEach((label) => expect(lineSource).toContain(label));
    expect(lineSource).toContain("<table");
    expect(lineSource).toContain("scrollIntoView");
    expect(cssSource).toContain("object-fit:contain");
  });

  it.each([
    "Nome",
    "Azienda",
    "Partita IVA / Codice fiscale",
    "Email",
    "Telefono",
    "Indirizzo",
    "Numero Offerta",
    "Data Preventivo",
    "Validità",
    "IVA",
    "Riferimento Progetto",
    "Referente Commerciale",
    "Tipologia di pagamento",
    "Sconto generale offerta (%)",
    "Mostra sconti nel PDF",
    "Mostra prezzi netti e totali riga",
    "Classe 1IM sulle righe dove richiesta",
    "Annota richiesta verniciatura ignifuga",
    "Note descrizione offerta",
  ])("contains the official field label %s", (label) => {
    expect(formSource).toContain(label);
  });
});
