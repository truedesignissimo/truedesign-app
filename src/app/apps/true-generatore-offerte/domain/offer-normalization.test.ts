import { describe, expect, it } from "vitest";
import { normalizeOffer } from "./offer-normalization";

describe("normalizeOffer", () => {
  it("migrates the reduced React payload without losing lines", () => {
    const offer = normalizeOffer({
      id: "o1",
      userId: "u1",
      number: "DRAFT-1",
      priceList: "ITAENG",
      customer: { name: "Giulia" },
      project: {},
      lines: [{
        id: "l1",
        productCode: "AB 1000",
        quantity: 1,
        unitPrice: 1000,
        extras: [],
        discountPercent: 12,
        configuration: {},
      }],
      globalDiscountPercent: 10,
    }, "u1");

    expect(offer.schemaVersion).toBe(3);
    expect(offer.globalDiscount).toBe("10");
    expect(offer.vatRate).toBe(22);
    expect(offer.customer.vatNumber).toBe("");
    expect(offer.lines[0].discount).toBe("12");
    expect(offer.lines[0].manualSurcharge).toBe(0);
  });

  it("never trusts a payload user id over the authenticated user", () => {
    const offer = normalizeOffer({ id: "o1", userId: "other", lines: [] }, "u1");
    expect(offer.userId).toBe("u1");
  });
});
