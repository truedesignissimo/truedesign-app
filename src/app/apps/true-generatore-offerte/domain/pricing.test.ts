import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOfferTotals } from "./pricing";
import type { Offer, OfferLine } from "./types";

const line = (overrides: Partial<OfferLine> = {}): OfferLine => ({
  id: "line-1",
  productCode: "AB 1000",
  quantity: 2,
  unitPrice: 1000,
  extras: [100, 50],
  discountPercent: 10,
  configuration: {},
  ...overrides,
});

describe("calculateLineTotal", () => {
  it("applies extras before line discount and quantity", () => {
    expect(calculateLineTotal(line())).toBe(2070);
  });

  it("rounds monetary values to two decimals", () => {
    expect(calculateLineTotal(line({ quantity: 3, unitPrice: 10.005, extras: [], discountPercent: 0 }))).toBe(30.02);
  });
});

describe("calculateOfferTotals", () => {
  it("applies the global discount after line totals", () => {
    const offer: Offer = {
      id: "offer-1",
      userId: "user-1",
      number: "OFF-001",
      priceList: "ITAENG",
      currency: "EUR",
      customer: {},
      project: {},
      lines: [line(), line({ id: "line-2", quantity: 1, discountPercent: 0 })],
      globalDiscountPercent: 5,
      createdAt: "2026-07-20T00:00:00.000Z",
      updatedAt: "2026-07-20T00:00:00.000Z",
    };

    expect(calculateOfferTotals(offer)).toEqual({ subtotal: 3220, discount: 161, total: 3059 });
  });
});
