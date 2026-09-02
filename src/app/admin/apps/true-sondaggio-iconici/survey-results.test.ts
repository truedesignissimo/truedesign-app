import { describe, expect, it } from "vitest";
import {
  buildSurveySummary,
  listSurveyParticipants,
  normalizeSurveyChoices,
  rankSurveyProducts,
  type SurveyResponse,
} from "./survey-results";

describe("normalizeSurveyChoices", () => {
  it("keeps only valid product choices", () => {
    expect(normalizeSurveyChoices([
      { name: " Arca ", url: " https://www.truedesign.it/it/prodotti/arca/ " },
      { name: "" },
      null,
      { name: "Blade", url: "javascript:alert(1)" },
    ])).toEqual([
      { name: "Arca", url: "https://www.truedesign.it/it/prodotti/arca/" },
      { name: "Blade", url: null },
    ]);
  });

  it("returns an empty list for malformed data", () => {
    expect(normalizeSurveyChoices("Arca")).toEqual([]);
  });
});

describe("rankSurveyProducts", () => {
  it("counts votes and sorts ties alphabetically", () => {
    const responses: SurveyResponse[] = [
      {
        id: "1",
        participant_name: "Ada",
        submitted_at: "2026-07-20T12:00:00Z",
        choices: [{ name: "Blade", url: null }, { name: "Arca", url: "https://www.truedesign.it/it/prodotti/arca/" }],
      },
      {
        id: "2",
        participant_name: "Lina",
        submitted_at: "2026-07-20T13:00:00Z",
        choices: [{ name: "blade", url: "https://www.truedesign.it/it/prodotti/blade/" }, { name: "Cloud", url: null }],
      },
    ];

    expect(rankSurveyProducts(responses)).toEqual([
      { name: "Blade", url: "https://www.truedesign.it/it/prodotti/blade/", votes: 2 },
      { name: "Arca", url: "https://www.truedesign.it/it/prodotti/arca/", votes: 1 },
      { name: "Cloud", url: null, votes: 1 },
    ]);
  });
});

describe("survey overview", () => {
  const responses: SurveyResponse[] = [
    {
      id: "1",
      participant_name: "Ada",
      submitted_at: "2026-07-20T12:00:00Z",
      choices: [{ name: "Arca", url: null }],
    },
    {
      id: "2",
      participant_name: "Lina",
      submitted_at: "2026-07-20T13:00:00Z",
      choices: [{ name: "Blade", url: null }, { name: "Cloud", url: null }],
    },
  ];

  it("lists every participation from newest to oldest", () => {
    expect(listSurveyParticipants(responses)).toEqual([
      { id: "2", name: "Lina", submittedAt: "2026-07-20T13:00:00Z" },
      { id: "1", name: "Ada", submittedAt: "2026-07-20T12:00:00Z" },
    ]);
  });

  it("builds a summary without assuming a fixed number of choices", () => {
    expect(buildSurveySummary(responses)).toEqual({
      responses: 2,
      preferences: 3,
      products: 3,
      firstResponseAt: "2026-07-20T12:00:00Z",
      lastResponseAt: "2026-07-20T13:00:00Z",
    });
  });
});
