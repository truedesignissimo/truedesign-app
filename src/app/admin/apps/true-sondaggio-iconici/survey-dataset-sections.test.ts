import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("dataset deletion controls wiring", () => {
  it("makes only the current dataset deletable, with a read-only default", () => {
    const sections = read("./survey-dataset-sections.tsx");
    expect(sections).toContain("allowResponseDeletion = false");
    expect(sections).toMatch(/allowResponseDeletion &&[\s\S]*<SurveyResponseDelete/);
    expect(read("./page.tsx")).toContain("responses={responses} allowResponseDeletion");
    expect(read("./archive/[archiveId]/page.tsx")).not.toContain("allowResponseDeletion");
  });

  it("uses the shared dialog, named and dated confirmation, and server refresh", () => {
    expect(existsSync(new URL("./survey-response-delete.tsx", import.meta.url))).toBe(true);
    const control = read("./survey-response-delete.tsx");
    expect(control).toContain("<SurveyConfirmDialog");
    expect(control).toContain('confirmWord="ELIMINA"');
    expect(control).toContain("participantName");
    expect(control).toContain("submittedAtLabel");
    expect(control).toContain("Gli archivi già salvati non verranno modificati");
    expect(control).toContain("router.refresh()");
    expect(control).toContain("deleteSurveyResponse(responseId, confirmation)");
  });

  it("keeps server and transport errors visible inside every modal", () => {
    for (const file of ["./survey-response-delete.tsx", "./survey-admin-actions.tsx", "./archive-list.tsx"]) {
      const control = read(file);
      expect(control).toMatch(/\bcatch\b/);
      expect(control).toMatch(/error=\{/);
    }
    expect(read("./survey-confirm-dialog.tsx")).toContain('role="alert"');
  });
});
