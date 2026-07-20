import type {
  Offer,
  OfferLanguage,
  OfferLine,
  PriceList,
  ProductConfiguration,
} from "./types";

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value !== null && typeof value === "object" ? value as UnknownRecord : {};
const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : value == null ? fallback : String(value);
const finite = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;
const datePart = (value: string): string => value.slice(0, 10);
const addDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

const priceList = (value: unknown): PriceList => value === "ENGFRA" ? "ENGFRA" : "ITAENG";
const language = (value: unknown): OfferLanguage =>
  (["it", "en", "fr", "de", "he", "zh", "ar"] as const).includes(value as OfferLanguage)
    ? value as OfferLanguage
    : "it";

function normalizeLine(value: unknown, index: number): OfferLine {
  const source = record(value);
  const configuration = record(source.configuration) as ProductConfiguration;
  const extras = Array.isArray(source.extras) ? source.extras.map(Number).filter(Number.isFinite) : [];
  const extrasByListSource = record(source.extrasByList);
  const listExtras = (key: PriceList): number[] | undefined =>
    Array.isArray(extrasByListSource[key])
      ? (extrasByListSource[key] as unknown[]).map(Number).filter(Number.isFinite)
      : undefined;
  const pricesSource = record(source.pricesByList);
  const pricesByList = {
    ...(Number.isFinite(Number(pricesSource.ITAENG)) ? { ITAENG: Number(pricesSource.ITAENG) } : {}),
    ...(Number.isFinite(Number(pricesSource.ENGFRA)) ? { ENGFRA: Number(pricesSource.ENGFRA) } : {}),
  };

  return {
    id: text(source.id, `line-${index + 1}`),
    productCode: text(source.productCode ?? source.code),
    quantity: Math.max(1, finite(source.quantity ?? source.qty, 1)),
    unitPrice: finite(source.unitPrice, 0),
    pricesByList,
    extras,
    extrasByList: { ITAENG: listExtras("ITAENG") ?? extras, ENGFRA: listExtras("ENGFRA") ?? extras },
    discount: text(source.discount, text(source.discountPercent, "0")),
    manualSurcharge: finite(source.manualSurcharge, 0),
    note: text(source.note ?? source.lineNote),
    configuration,
    ...(typeof source.customImagePath === "string" ? { customImagePath: source.customImagePath } : {}),
  };
}

export function normalizeOffer(value: unknown, userId: string): Offer {
  const source = record(value);
  const customer = record(source.customer ?? source.client);
  const project = record(source.project);
  const specialOptions = record(source.specialOptions);
  const now = new Date().toISOString();
  const createdAt = text(source.createdAt, now);
  const offerDate = datePart(text(source.offerDate, datePart(createdAt)));
  const validityDays = Math.max(0, finite(source.validityDays, 30));
  const validUntil = text(source.validUntil ?? project.validUntil, addDays(offerDate, validityDays));
  const id = text(source.id, crypto.randomUUID());

  return {
    schemaVersion: 3,
    id,
    userId,
    number: text(source.number ?? source.offerNumber, `DRAFT-${id.slice(0, 8).toUpperCase()}`),
    offerDate,
    validityDays,
    validUntil,
    priceList: priceList(source.priceList),
    language: language(source.language),
    currency: "EUR",
    customer: {
      name: text(customer.name),
      company: text(customer.company),
      vatNumber: text(customer.vatNumber),
      email: text(customer.email),
      phone: text(customer.phone),
      address: text(customer.address),
    },
    project: {
      reference: text(project.reference ?? source.projectReference),
      contact: text(project.contact),
      validUntil,
      notes: text(project.notes),
    },
    salesRepresentative: text(source.salesRepresentative ?? source.salesRep),
    paymentTerms: text(source.paymentTerms),
    offerNotes: text(source.offerNotes),
    lines: Array.isArray(source.lines) ? source.lines.map(normalizeLine) : [],
    globalDiscount: text(source.globalDiscount, text(source.globalDiscountPercent, "0")),
    vatRate: Math.max(0, finite(source.vatRate, 22)),
    showDiscounts: bool(source.showDiscounts, true),
    showNetPrices: bool(source.showNetPrices, true),
    specialOptions: {
      class1IM: bool(specialOptions.class1IM ?? source.class1IM, false),
      fireRetardant: bool(specialOptions.fireRetardant ?? source.fireRetardant, false),
    },
    createdAt,
    updatedAt: text(source.updatedAt, createdAt),
  };
}
