import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOfferTotals } from "./pricing";
import type { Offer, OfferLine } from "./types";

const line = (overrides: Partial<OfferLine> = {}): OfferLine => ({
  id: "line-1",
  productCode: "AB 1000",
  quantity: 2,
  unitPrice: 1000,
  extras: [100, 50],
  discount: "10",
  manualSurcharge: 0,
  note: "",
  configuration: {},
  ...overrides,
});

describe("calculateLineTotal", () => {
  it("applies extras before line discount and quantity", () => {
    expect(calculateLineTotal(line())).toBe(2070);
  });

  it("rounds monetary values to two decimals", () => {
    expect(calculateLineTotal(line({ quantity: 3, unitPrice: 10.005, extras: [], discount: "0" }))).toBe(30.02);
  });
});

describe("calculateOfferTotals", () => {
  it("applies the global discount after line totals", () => {
    const offer: Offer = {
      schemaVersion: 3, id: "offer-1", userId: "user-1", number: "OFF-001",
      offerDate: "2026-07-20", validityDays: 30, validUntil: "2026-08-19",
      priceList: "ITAENG", language: "it", currency: "EUR",
      customer: {}, project: {}, salesRepresentative: "", paymentTerms: "", offerNotes: "",
      lines: [line(), line({ id: "line-2", quantity: 1, discount: "0" })],
      globalDiscount: "5", vatRate: 22, showDiscounts: true, showNetPrices: true,
      specialOptions: { class1IM: false, fireRetardant: false },
      createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
    };

    expect(calculateOfferTotals(offer)).toEqual({ subtotal: 3220, discount: 161, net: 3059, vat: 672.98, total: 3731.98 });
  });
});
