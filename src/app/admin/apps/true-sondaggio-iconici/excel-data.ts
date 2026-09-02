import {
  buildSurveySummary,
  normalizeSurveyChoices,
  rankSurveyProducts,
  type SurveyResponse,
} from "./survey-results";

const FORMULA_PREFIX = /^[=+\-@]/;

export function escapeSpreadsheetCell(value: string) {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function buildSurveyWorkbookData(responses: SurveyResponse[]) {
  const summary = buildSurveySummary(responses);

  return {
    summary,
    ranking: rankSurveyProducts(responses).map((product, index) => ({
      position: index + 1,
      product: escapeSpreadsheetCell(product.name),
      votes: product.votes,
      participantShare: summary.responses
        ? Math.round((product.votes / summary.responses) * 100)
        : 0,
    })),
    responses: [...responses]
      .sort((left, right) => Date.parse(right.submitted_at) - Date.parse(left.submitted_at))
      .map((response) => ({
        submittedAt: response.submitted_at,
        participant: escapeSpreadsheetCell(response.participant_name),
        choices: normalizeSurveyChoices(response.choices)
          .map((choice) => escapeSpreadsheetCell(choice.name))
          .join(", "),
      })),
  };
}
