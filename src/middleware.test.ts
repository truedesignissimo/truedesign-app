import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./middleware";

describe("protected routes", () => {
  it("protects the complete apps area", () => {
    expect(isProtectedPath("/apps/true-generatore-offerte")).toBe(true);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
