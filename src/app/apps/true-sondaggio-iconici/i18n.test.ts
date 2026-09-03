import { describe, expect, it } from "vitest";
import { resolveSurveyLocale, surveyCopy, surveyErrorMessage } from "./i18n";

describe("survey language", () => {
  it("prefers a supported URL language, then saved preference, then Italian", () => {
    expect(resolveSurveyLocale("fr", "en")).toBe("fr");
    expect(resolveSurveyLocale("de", "en")).toBe("en");
    expect(resolveSurveyLocale(null, "fr")).toBe("fr");
    expect(resolveSurveyLocale("<script>", "DE")).toBe("it");
    expect(resolveSurveyLocale(null, null)).toBe("it");
  });

  it("provides matching complete dictionaries and distinct translations", () => {
    for (const locale of ["it", "en", "fr"] as const) {
      expect(Object.keys(surveyCopy[locale]).sort()).toEqual(Object.keys(surveyCopy.it).sort());
      expect(Object.keys(surveyCopy[locale].errors).sort()).toEqual(Object.keys(surveyCopy.it.errors).sort());
      expect(surveyCopy[locale].thanks("Ada")).toContain("Ada");
    }
    expect(new Set(Object.values(surveyCopy).map((copy) => copy.title)).size).toBe(3);
  });

  it("localizes zero, singular and plural remaining choices", () => {
    expect(surveyCopy.it.remaining(1)).toBe("Ancora 1 scelta");
    expect(surveyCopy.it.remaining(2)).toBe("Ancora 2 scelte");
    expect(surveyCopy.en.remaining(1)).toBe("1 choice left");
    expect(surveyCopy.en.remaining(2)).toBe("2 choices left");
    expect(surveyCopy.fr.remaining(1)).toBe("Encore 1 choix");
    for (const copy of Object.values(surveyCopy)) {
      expect(copy.remaining(0)).toBe(copy.selectionComplete);
      expect(copy.remaining(10)).toContain("10");
    }
  });

  it("maps all stable API failures without exposing unknown server errors", () => {
    for (const locale of ["it", "en", "fr"] as const) {
      for (const code of ["origin_not_allowed", "unsupported_format", "request_too_large", "invalid_submission", "save_failed", "network_error"]) {
        expect(surveyErrorMessage(locale, code).length).toBeGreaterThan(15);
      }
      expect(surveyErrorMessage(locale, "SQL password secret")).toBe(surveyCopy[locale].errors.save_failed);
      expect(surveyErrorMessage(locale, "toString")).toBe(surveyCopy[locale].errors.save_failed);
    }
  });
});
