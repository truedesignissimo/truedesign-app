import { describe, expect, it } from "vitest";
import { getCatalogAppPath, isProtectedPath } from "./middleware";

describe("protected routes", () => {
  it("protects the account areas", () => {
    expect(isProtectedPath("/apps/true-generatore-offerte")).toBe(false);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("maps nested app routes to the catalog URL", () => {
    expect(getCatalogAppPath("/apps/true-sondaggio-iconici/api")).toBe(
      "/apps/true-sondaggio-iconici"
    );
  });
});
