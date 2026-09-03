export type SurveyLocale = "it" | "en" | "fr";
export const SURVEY_LOCALE_STORAGE_KEY = "true-iconic-survey-language";
export const surveyLanguages = [
  { locale: "it", flag: "🇮🇹", label: "Italiano" },
  { locale: "en", flag: "🇬🇧", label: "English" },
  { locale: "fr", flag: "🇫🇷", label: "Français" },
] as const;

function isSurveyLocale(value: unknown): value is SurveyLocale {
  return value === "it" || value === "en" || value === "fr";
}

export function resolveSurveyLocale(query: unknown, stored: unknown): SurveyLocale {
  return isSurveyLocale(query) ? query : isSurveyLocale(stored) ? stored : "it";
}

export type SurveyErrorCode = "origin_not_allowed" | "unsupported_format" | "request_too_large" | "invalid_submission" | "save_failed" | "network_error";

type SurveyCopy = {
  pageTitle: string;
  languageLabel: string;
  homeLabel: string;
  kicker: string;
  title: string;
  intro: string;
  productsLabel: string;
  selectedLabel: string;
  progress: string;
  nameLabel: string;
  namePlaceholder: string;
  submit: string;
  sending: string;
  enterName: string;
  ready: string;
  remaining: (count: number) => string;
  selectionComplete: string;
  recorded: string;
  thanks: (name: string) => string;
  success: string;
  backHome: string;
  errors: Record<SurveyErrorCode, string>;
};

export const surveyCopy: Record<SurveyLocale, SurveyCopy> = {
  it: {
    pageTitle: "Sondaggio Prodotti Iconici · True",
    languageLabel: "Lingua del sondaggio",
    homeLabel: "True · Torna alla homepage",
    kicker: "True · Prodotti iconici",
    title: "Quali sono i prodotti iconici di True?",
    intro: "Aiutaci a identificare i prodotti che meglio rappresentano l’identità di True. Seleziona le dieci collezioni che ritieni più iconiche e riconoscibili.",
    productsLabel: "Prodotti True",
    selectedLabel: "selezionato",
    progress: "di 10 selezionati",
    nameLabel: "Il tuo nome",
    namePlaceholder: "Nome e cognome",
    submit: "Invia selezione",
    sending: "Invio…",
    enterName: "Inserisci il tuo nome per inviare.",
    ready: "Tutto pronto: puoi inviare la tua selezione.",
    remaining: (count) => count === 0 ? "Selezione completa" : `Ancora ${count} ${count === 1 ? "scelta" : "scelte"}`,
    selectionComplete: "Selezione completa",
    recorded: "Risposta registrata",
    thanks: (name) => `Grazie, ${name}!`,
    success: "Le tue dieci scelte sono state inviate correttamente. Grazie per averci aiutato a raccontare l’identità di True.",
    backHome: "Torna alla homepage",
    errors: {
      origin_not_allowed: "Questa pagina non può inviare il sondaggio. Aprilo direttamente su truedesign.app.",
      unsupported_format: "Non è stato possibile leggere la selezione. Ricarica la pagina e riprova.",
      request_too_large: "I dati inviati sono troppo lunghi. Controlla il nome e riprova.",
      invalid_submission: "Inserisci il tuo nome e seleziona esattamente dieci prodotti.",
      save_failed: "Non è stato possibile registrare la risposta. Le tue scelte sono conservate: riprova tra poco.",
      network_error: "Connessione interrotta. Controlla la rete e riprova: le tue scelte sono ancora qui.",
    },
  },
  en: {
    pageTitle: "Iconic Products Survey · True",
    languageLabel: "Survey language",
    homeLabel: "True · Back to homepage",
    kicker: "True · Iconic products",
    title: "Which products capture the essence of True?",
    intro: "Help us identify the products that best represent True’s identity. Select the ten collections you consider the most iconic and recognisable.",
    productsLabel: "True products",
    selectedLabel: "selected",
    progress: "of 10 selected",
    nameLabel: "Your name",
    namePlaceholder: "First and last name",
    submit: "Submit selection",
    sending: "Sending…",
    enterName: "Enter your name to submit.",
    ready: "All set: you can submit your selection.",
    remaining: (count) => count === 0 ? "Selection complete" : `${count} ${count === 1 ? "choice" : "choices"} left`,
    selectionComplete: "Selection complete",
    recorded: "Response recorded",
    thanks: (name) => `Thank you, ${name}!`,
    success: "Your ten choices have been submitted successfully. Thank you for helping us tell the story of True.",
    backHome: "Back to homepage",
    errors: {
      origin_not_allowed: "This page cannot submit the survey. Open it directly on truedesign.app.",
      unsupported_format: "We could not read your selection. Reload the page and try again.",
      request_too_large: "The submitted details are too long. Check your name and try again.",
      invalid_submission: "Enter your name and select exactly ten products.",
      save_failed: "We could not record your response. Your choices are still here: please try again shortly.",
      network_error: "Connection interrupted. Check your network and try again: your choices are still here.",
    },
  },
  fr: {
    pageTitle: "Sondage Produits Iconiques · True",
    languageLabel: "Langue du sondage",
    homeLabel: "True · Retour à l’accueil",
    kicker: "True · Produits iconiques",
    title: "Quels produits incarnent l’identité de True ?",
    intro: "Aidez-nous à identifier les produits qui représentent le mieux l’identité de True. Sélectionnez les dix collections que vous considérez comme les plus iconiques et reconnaissables.",
    productsLabel: "Produits True",
    selectedLabel: "sélectionné",
    progress: "sur 10 sélectionnés",
    nameLabel: "Votre nom",
    namePlaceholder: "Prénom et nom",
    submit: "Envoyer la sélection",
    sending: "Envoi…",
    enterName: "Saisissez votre nom pour envoyer.",
    ready: "Tout est prêt : vous pouvez envoyer votre sélection.",
    remaining: (count) => count === 0 ? "Sélection complète" : `Encore ${count} choix`,
    selectionComplete: "Sélection complète",
    recorded: "Réponse enregistrée",
    thanks: (name) => `Merci, ${name} !`,
    success: "Vos dix choix ont bien été envoyés. Merci de nous aider à raconter l’identité de True.",
    backHome: "Retour à l’accueil",
    errors: {
      origin_not_allowed: "Cette page ne peut pas envoyer le sondage. Ouvrez-le directement sur truedesign.app.",
      unsupported_format: "Impossible de lire votre sélection. Rechargez la page et réessayez.",
      request_too_large: "Les données envoyées sont trop longues. Vérifiez votre nom et réessayez.",
      invalid_submission: "Saisissez votre nom et sélectionnez exactement dix produits.",
      save_failed: "Impossible d’enregistrer votre réponse. Vos choix sont conservés : réessayez dans un instant.",
      network_error: "Connexion interrompue. Vérifiez votre réseau et réessayez : vos choix sont toujours là.",
    },
  },
};

export function surveyErrorMessage(locale: SurveyLocale, code: unknown): string {
  const errors = surveyCopy[locale].errors;
  return typeof code === "string" && Object.hasOwn(errors, code)
    ? errors[code as SurveyErrorCode]
    : errors.save_failed;
}
