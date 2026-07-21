import { describe, expect, it } from "vitest";
import { safeAuthDestination } from "./auth-redirect";

describe("safeAuthDestination", () => {
  it("accepts internal paths", () => {
    expect(safeAuthDestination("/imposta-password")).toBe("/imposta-password");
    expect(safeAuthDestination("/login?confermato=1")).toBe("/login?confermato=1");
  });

  it("blocks external and malformed redirects", () => {
    expect(safeAuthDestination("https://example.com")).toBe("/dashboard");
    expect(safeAuthDestination("//example.com")).toBe("/dashboard");
    expect(safeAuthDestination("/\\example.com")).toBe("/dashboard");
    expect(safeAuthDestination(null)).toBe("/dashboard");
  });
});
