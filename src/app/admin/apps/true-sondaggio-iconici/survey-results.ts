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

export type SurveyParticipant = {
  id: string;
  name: string;
  submittedAt: string;
};

export type SurveySummary = {
  responses: number;
  preferences: number;
  products: number;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
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

export function listSurveyParticipants(responses: SurveyResponse[]): SurveyParticipant[] {
  return [...responses]
    .sort((left, right) => Date.parse(right.submitted_at) - Date.parse(left.submitted_at))
    .map((response) => ({
      id: response.id,
      name: response.participant_name,
      submittedAt: response.submitted_at,
    }));
}

export function buildSurveySummary(responses: SurveyResponse[]): SurveySummary {
  const submittedAt = responses
    .map((response) => response.submitted_at)
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort((left, right) => Date.parse(left) - Date.parse(right));

  return {
    responses: responses.length,
    preferences: responses.reduce(
      (total, response) => total + normalizeSurveyChoices(response.choices).length,
      0,
    ),
    products: rankSurveyProducts(responses).length,
    firstResponseAt: submittedAt[0] ?? null,
    lastResponseAt: submittedAt.at(-1) ?? null,
  };
}
