import { describe, expect, it } from "vitest";
import { createLineFromProduct, getPriceChoices, selectedExtraAmounts } from "./product-pricing";
import type { CatalogProduct } from "../data/catalog";

describe("product pricing", () => {
  it("keeps both official list prices for finish variants", () => {
    const product = { code: "TD 100H", family: "TODD", finishes: [{ id: "walnut", name: "Walnut", price: 980, price_EF: 1011 }] } as CatalogProduct;
    expect(getPriceChoices(product)).toEqual([{ id: "walnut", label: "Walnut", ITAENG: 980, ENGFRA: 1011 }]);
  });

  it("creates fabric-category lines from the selected list without inventing missing prices", () => {
    const product = { code: "AB 1000", family: "ABISKO", prices: { S: 1000, T: 1100, M: null }, prices_EF: { S: 1200, T: 1300, M: null } } as CatalogProduct;
    const line = createLineFromProduct(product, "ENGFRA", "line-1");
    expect(line.unitPrice).toBe(1200);
    expect(line.pricesByList).toEqual({ ITAENG: 1000, ENGFRA: 1200 });
    expect(getPriceChoices(product).map((choice) => choice.id)).toEqual(["S", "T"]);
  });

  it("recomputes selected extras from official values without index drift", () => {
    const extras = [
      { id: "color", ITAENG: 80, ENGFRA: 90 },
      { id: "fire", ITAENG: 120, ENGFRA: 140 },
    ];
    expect(selectedExtraAmounts(extras, { "extra:fire": true }, "ENGFRA")).toEqual([140]);
  });
});
