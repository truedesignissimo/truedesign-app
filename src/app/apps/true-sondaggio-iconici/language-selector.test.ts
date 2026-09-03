import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surveyLanguages } from "./i18n";

const source = readFileSync(new URL("./survey.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./survey.module.css", import.meta.url), "utf8");
const selector = source.slice(source.indexOf("const languageSelector"), source.indexOf("const masthead"));

describe("compact survey language flags", () => {
  it("keeps three named accessible controls without visible language text or emoji", () => {
    expect(surveyLanguages.map(({ locale }) => locale)).toEqual(["it", "en", "fr"]);
    expect(selector).toContain("aria-label={language.label}");
    expect(selector).toContain("aria-pressed={locale === language.locale}");
    expect(selector).not.toContain("<span>{language.label}</span>");
    expect(selector).not.toContain("language.flag");
    expect(selector).toContain("<svg");
    expect(selector).toContain('aria-hidden="true"');
  });

  it("keeps flags round and touch targets at least 44px without expanding on mobile", () => {
    const button = css.match(/\.languages button \{([^}]+)\}/)?.[1] || "";
    expect(button).toMatch(/width: 44px/);
    expect(button).toMatch(/height: 44px/);
    expect(button).toMatch(/border-radius: 50%/);
    const flag = css.match(/\.languageFlag \{([^}]+)\}/)?.[1] || "";
    expect(flag).toMatch(/border-radius: 50%/);
    expect(flag).toMatch(/overflow: hidden/);
    expect(css).not.toContain(".languages { width: 100%; }");
  });
});
