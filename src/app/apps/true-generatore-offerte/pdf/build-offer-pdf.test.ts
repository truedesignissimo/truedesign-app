import { describe, expect, it } from "vitest";
import { fitImage } from "./build-offer-pdf";

describe("fitImage", () => {
  it("fits landscape images without stretching", () => {
    expect(fitImage(1200, 600, 40, 40)).toEqual({ width: 40, height: 20 });
  });

  it("fits portrait images without stretching", () => {
    expect(fitImage(600, 1200, 40, 30)).toEqual({ width: 15, height: 30 });
  });
});
