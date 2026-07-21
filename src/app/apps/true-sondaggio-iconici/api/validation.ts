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

export function isValidSurveySubmission(name: string, choices: string[], links: string[]) {
  return Boolean(
    name &&
    name.length <= 120 &&
    choices.length === 5 &&
    choices.every((choice) => choice.length <= 180) &&
    links.length === 5 &&
    links.every(isTrueDesignProductUrl)
  );
}
