import { describe, expect, it } from "vitest";
import { toggleSurveySelection } from "./selection";

describe("ten product selections", () => {
  it("adds and removes without mutating or duplicating the original selection", () => {
    const current = [0, 1];
    expect(toggleSurveySelection(current, 0)).toEqual([1]);
    expect(toggleSurveySelection(current, 2)).toEqual([0, 1, 2]);
    expect(current).toEqual([0, 1]);
    expect(toggleSurveySelection(toggleSurveySelection([], 3), 3)).toEqual([]);
  });
  it("rejects an eleventh selection but still allows deselection", () => {
    const full = Array.from({ length: 10 }, (_, i) => i);
    expect(toggleSurveySelection(full, 10)).toBe(full);
    expect(toggleSurveySelection(full, 5)).toHaveLength(9);
  });
  it("ignores invalid product indexes", () => {
    expect(toggleSurveySelection([], -1)).toEqual([]);
    expect(toggleSurveySelection([], 1.2)).toEqual([]);
  });
});
