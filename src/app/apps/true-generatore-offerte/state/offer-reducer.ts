import type { Offer, OfferLanguage, OfferLine, PriceList } from "../domain/types";

export type OfferAction =
  | { type: "line/add"; line: OfferLine }
  | { type: "line/update"; lineId: string; patch: Partial<OfferLine> }
  | { type: "line/remove"; lineId: string }
  | { type: "price-list/set"; priceList: PriceList }
  | { type: "language/set"; language: OfferLanguage }
  | { type: "offer/replace"; offer: Offer };

const datePart = (value: string): string => value.slice(0, 10);
const addDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export function createEmptyOffer(
  userId: string,
  id = crypto.randomUUID(),
  timestamp = new Date().toISOString(),
): Offer {
  const offerDate = datePart(timestamp);
  const validityDays = 30;
  const validUntil = addDays(offerDate, validityDays);
  return {
    schemaVersion: 3,
    id,
    userId,
    number: `DRAFT-${id.slice(0, 8).toUpperCase()}`,
    offerDate,
    validityDays,
    validUntil,
    priceList: "ITAENG",
    language: "it",
    currency: "EUR",
    customer: { name: "", company: "", vatNumber: "", email: "", phone: "", address: "" },
    project: { reference: "", contact: "", validUntil, notes: "" },
    salesRepresentative: "",
    paymentTerms: "",
    offerNotes: "",
    lines: [],
    globalDiscount: "0",
    vatRate: 22,
    showDiscounts: true,
    showNetPrices: true,
    specialOptions: { class1IM: false, fireRetardant: false },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function offerReducer(state: Offer, action: OfferAction): Offer {
  switch (action.type) {
    case "line/add":
      return { ...state, lines: [...state.lines, action.line] };
    case "line/update":
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.id === action.lineId ? { ...line, ...action.patch } : line,
        ),
      };
    case "line/remove":
      return { ...state, lines: state.lines.filter((line) => line.id !== action.lineId) };
    case "price-list/set":
      return {
        ...state,
        priceList: action.priceList,
        lines: state.lines.map((line) => ({
          ...line,
          unitPrice: line.pricesByList?.[action.priceList] ?? line.unitPrice,
          extras: line.extrasByList?.[action.priceList] ?? line.extras,
        })),
      };
    case "language/set":
      return { ...state, language: action.language };
    case "offer/replace":
      return action.offer;
  }
}
