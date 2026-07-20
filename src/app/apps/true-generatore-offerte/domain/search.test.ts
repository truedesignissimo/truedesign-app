import { describe, expect, it } from "vitest";
import { searchProducts } from "./search";
import type { CatalogProduct } from "../data/catalog";

const products = [
  { code: "AB 1000", family: "ABISKO", name_it: "poltrona", isAccessory: false },
  { code: "AB AC01", family: "ABISKO", name_it: "accessorio", isAccessory: true },
  { code: "NT 4090", family: "NOT", name_it: "poltrona girevole", isAccessory: false },
] as CatalogProduct[];

describe("searchProducts", () => {
  it("prioritizes exact codes and keeps accessories after main products", () => {
    expect(searchProducts(products, "AB").map((item) => item.code)).toEqual(["AB 1000", "AB AC01"]);
    expect(searchProducts(products, "NT 4090")[0].code).toBe("NT 4090");
  });
});
