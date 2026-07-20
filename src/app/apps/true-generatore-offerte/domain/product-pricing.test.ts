import { describe, expect, it } from "vitest";
import {
  createLineFromProduct,
  configurationForPriceChoice,
  effectiveFabricCategory,
  extraAmount,
  fabricCategoryForProduct,
  getPriceChoices,
  selectedExtraAmounts,
} from "./product-pricing";
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

  it("waives an under-ten extra at the official threshold", () => {
    expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 9, false)).toBe(80);
    expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 10, false)).toBe(0);
    expect(extraAmount({ amount: 80, freeFromQuantity: 10 }, 2, true)).toBe(0);
  });

  it("pairs fabric categories with every official finish in both price lists", () => {
    const product = {
      code: "AU 1044",
      family: "AURA",
      has_fabric: true,
      finishes: [
        { id: "ash", name: "Frassino / Ashwood", prices: { S: 995, T: 1025 } },
        { id: "oak", name: "Rovere / Oakwood", prices: { S: 1095, T: 1125 } },
      ],
      finishes_EF: [
        { id: "ash", name: "Frassino / Ashwood", prices: { S: 1081, T: 1114 } },
        { id: "oak", name: "Rovere / Oakwood", prices: { S: 1190, T: 1223 } },
      ],
    } as CatalogProduct;

    expect(getPriceChoices(product)).toEqual([
      { id: "ash::S", label: "Frassino / Ashwood - Categoria S", finishId: "ash", category: "S", ITAENG: 995, ENGFRA: 1081 },
      { id: "ash::T", label: "Frassino / Ashwood - Categoria T", finishId: "ash", category: "T", ITAENG: 1025, ENGFRA: 1114 },
      { id: "oak::S", label: "Rovere / Oakwood - Categoria S", finishId: "oak", category: "S", ITAENG: 1095, ENGFRA: 1190 },
      { id: "oak::T", label: "Rovere / Oakwood - Categoria T", finishId: "oak", category: "T", ITAENG: 1125, ENGFRA: 1223 },
    ]);
    expect(createLineFromProduct(product, "ITAENG", "aura-line").configuration).toMatchObject({
      priceChoice: "ash::S",
      finishId: "ash",
      category: "S",
      pricingMode: "fabric",
    });
  });

  it("uses product-specific fabric categories and advances one category for 1IM", () => {
    const product = {
      code: "AH 7090",
      family: "ARCA",
      fabricCollectionCategories: { "MAIN LINE FLAX": "T", "SYNERGY": "F" },
    } as CatalogProduct;
    const fabric = { id: "synergy-1", collection: "Synergy by Camira", category: "M" };

    expect(fabricCategoryForProduct(product, fabric)).toBe("F");
    expect(effectiveFabricCategory(product, fabric, true)).toBe("L");
  });

  it("synchronizes linked finishes and removes incompatible component selections", () => {
    const product = {
      code: "AU 1044",
      family: "AURA",
      componentGroups: [
        { id: "wood", linkedPrice: true, options: [{ id: "ash", label: "Ash" }, { id: "oak", label: "Oak" }] },
        { id: "base", linkedPrice: false, options: [
          { id: "ash-only", label: "Ash base", priceVariants: ["ash"] },
          { id: "oak-only", label: "Oak base", priceVariants: ["oak"] },
        ] },
      ],
    } as CatalogProduct;
    const choice = { id: "oak::S", label: "Oak - S", finishId: "oak", category: "S", ITAENG: 100, ENGFRA: 110 };

    expect(configurationForPriceChoice(product, choice, {
      "component:wood": "ash",
      "component:base": "ash-only",
    })).toMatchObject({
      "component:wood": "oak",
      "component:base": "oak-only",
      finishId: "oak",
      category: "S",
      priceChoice: "oak::S",
    });
  });
});
