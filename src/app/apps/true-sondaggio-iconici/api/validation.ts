export function isTrueDesignProductUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "truedesign.it" || url.hostname === "www.truedesign.it") &&
      url.pathname.startsWith("/it/prodotti/")
    );
  } catch {
    return false;
  }
}

export const SURVEY_SELECTION_COUNT = 10;

export function isValidSurveySubmission(name: string, choices: string[], links: string[]) {
  return Boolean(
    name &&
    name.length <= 120 &&
    choices.length === SURVEY_SELECTION_COUNT &&
    choices.every((choice) => choice.length <= 180) &&
    links.length === SURVEY_SELECTION_COUNT &&
    links.every(isTrueDesignProductUrl)
  );
}
