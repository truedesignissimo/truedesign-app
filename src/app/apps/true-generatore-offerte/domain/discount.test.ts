import { describe, expect, it } from "vitest";
import { discountLabel, discountMultiplier, parseDiscountExpression } from "./discount";

describe("chained discounts", () => {
  it("applies 50+5 sequentially", () => {
    expect(parseDiscountExpression("50+5")).toEqual([50, 5]);
    expect(discountMultiplier("50+5")).toBeCloseTo(0.475);
  });

  it("clamps invalid percentages and accepts comma decimals", () => {
    expect(parseDiscountExpression("10,5 + 200 + bad")).toEqual([10.5, 100]);
  });

  it("normalizes the label without inventing a discount", () => {
    expect(discountLabel(" 50 + 5 ")).toBe("50+5");
    expect(discountLabel("")).toBe("0");
  });
});
