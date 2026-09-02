import { describe, expect, it } from "vitest";
import { buildSurveyWorkbookData, escapeSpreadsheetCell } from "./excel-data";
import type { SurveyResponse } from "./survey-results";

describe("survey Excel data", () => {
  it("neutralizes values that Excel could execute as formulas", () => {
    expect(escapeSpreadsheetCell('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(escapeSpreadsheetCell("+SUM(1,1)")).toBe("'+SUM(1,1)");
    expect(escapeSpreadsheetCell("Ada")).toBe("Ada");
  });

  it("builds stable rows from mixed historical response sizes", () => {
    const responses: SurveyResponse[] = [
      {
        id: "1",
        participant_name: "=Ada",
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

    const workbook = buildSurveyWorkbookData(responses);

    expect(workbook.summary.responses).toBe(2);
    expect(workbook.ranking.map((row) => row.product)).toEqual(["Arca", "Blade", "Cloud"]);
    expect(workbook.responses).toEqual([
      {
        submittedAt: "2026-07-20T13:00:00Z",
        participant: "Lina",
        choices: "Blade, Cloud",
      },
      {
        submittedAt: "2026-07-20T12:00:00Z",
        participant: "'=Ada",
        choices: "Arca",
      },
    ]);
  });
});
