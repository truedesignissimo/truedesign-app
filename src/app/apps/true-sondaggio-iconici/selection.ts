import { SURVEY_SELECTION_COUNT } from "./api/validation";

export function toggleSurveySelection(current: number[], index: number): number[] {
  if (!Number.isInteger(index) || index < 0) return current;
  if (current.includes(index)) return current.filter((item) => item !== index);
  if (current.length >= SURVEY_SELECTION_COUNT) return current;
  return [...current, index];
}
