import type { Offer, OfferLine, PriceList } from "../domain/types";

export type OfferAction =
  | { type: "line/add"; line: OfferLine }
  | { type: "line/update"; lineId: string; patch: Partial<OfferLine> }
  | { type: "line/remove"; lineId: string }
  | { type: "price-list/set"; priceList: PriceList }
  | { type: "offer/replace"; offer: Offer };

export function createEmptyOffer(
  userId: string,
  id = crypto.randomUUID(),
  timestamp = new Date().toISOString(),
): Offer {
  return {
    id,
    userId,
    number: `DRAFT-${id.slice(0, 8).toUpperCase()}`,
    priceList: "ITAENG",
    currency: "EUR",
    customer: {},
    project: {},
    lines: [],
    globalDiscountPercent: 0,
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
        })),
      };
    case "offer/replace":
      return action.offer;
  }
}
