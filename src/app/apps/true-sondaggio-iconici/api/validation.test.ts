import { describe, expect, it } from "vitest";
import { isTrueDesignProductUrl, isValidSurveySubmission } from "./validation";

describe("survey submission validation", () => {
  it("accepts only HTTPS product links on the True Design catalogue", () => {
    expect(isTrueDesignProductUrl("https://www.truedesign.it/it/prodotti/abisko/")).toBe(true);
    expect(isTrueDesignProductUrl("http://www.truedesign.it/it/prodotti/abisko/")).toBe(false);
    expect(isTrueDesignProductUrl("https://example.com/it/prodotti/abisko/")).toBe(false);
  });

  it("requires exactly five valid choices and links", () => {
    const choices = ["1. A", "2. B", "3. C", "4. D", "5. E"];
    const links = choices.map((_, index) => `https://www.truedesign.it/it/prodotti/prodotto-${index}/`);

    expect(isValidSurveySubmission("Mario Rossi", choices, links)).toBe(true);
    expect(isValidSurveySubmission("Mario Rossi", choices, [...links.slice(0, 4), "https://example.com/"])).toBe(false);
    expect(isValidSurveySubmission("Mario Rossi", choices.slice(0, 4), links.slice(0, 4))).toBe(false);
  });
});
