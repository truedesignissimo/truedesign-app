import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createSurveyWorkbook } from "./workbook";
import type { SurveyResponse } from "./survey-results";

describe("survey workbook", () => {
  it("creates a valid XLSX package with three worksheets", () => {
    const responses: SurveyResponse[] = [{
      id: "1",
      participant_name: "=Ada",
      submitted_at: "2026-07-20T12:00:00Z",
      choices: [{ name: "Arca", url: null }],
    }];

    const archive = unzipSync(createSurveyWorkbook(responses));
    const workbookXml = strFromU8(archive["xl/workbook.xml"]);
    const responsesXml = strFromU8(archive["xl/worksheets/sheet3.xml"]);

    expect(Object.keys(archive)).toContain("[Content_Types].xml");
    expect(workbookXml).toContain('name="Riepilogo"');
    expect(workbookXml).toContain('name="Classifica"');
    expect(workbookXml).toContain('name="Risposte"');
    expect(responsesXml).toContain("&apos;=Ada");
    expect(responsesXml).toContain("Arca");
  });
});
