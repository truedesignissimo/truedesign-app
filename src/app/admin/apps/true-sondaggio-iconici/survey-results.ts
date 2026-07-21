export type SurveyChoice = {
  name: string;
  url: string | null;
};

export type SurveyResponse = {
  id: string;
  participant_name: string;
  choices: unknown;
  submitted_at: string;
};

export type RankedProduct = {
  name: string;
  url: string | null;
  votes: number;
};

function normalizeProductUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    const isTrueDesignProduct =
      url.protocol === "https:" &&
      (url.hostname === "www.truedesign.it" || url.hostname === "truedesign.it") &&
      url.pathname.startsWith("/it/prodotti/");

    return isTrueDesignProduct ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeSurveyChoices(value: unknown): SurveyChoice[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((choice) => {
    if (!choice || typeof choice !== "object") return [];

    const record = choice as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) return [];

    return [{
      name,
      url: normalizeProductUrl(record.url),
    }];
  });
}

export function rankSurveyProducts(responses: SurveyResponse[]): RankedProduct[] {
  const products = new Map<string, RankedProduct>();

  for (const response of responses) {
    for (const choice of normalizeSurveyChoices(response.choices)) {
      const key = choice.name.toLocaleLowerCase("it-IT");
      const current = products.get(key);

      if (current) {
        current.votes += 1;
        current.url ??= choice.url;
      } else {
        products.set(key, { ...choice, votes: 1 });
      }
    }
  }

  return Array.from(products.values()).sort(
    (left, right) => right.votes - left.votes || left.name.localeCompare(right.name, "it-IT"),
  );
}
