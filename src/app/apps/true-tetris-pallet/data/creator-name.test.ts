import { describe, expect, it } from "vitest";
import { creatorFirstName } from "./creator-name";

describe("creatorFirstName", () => {
  it("keeps only the first name from a profile full name", () => {
    expect(creatorFirstName("  Dario   Breggie  ")).toBe("Dario");
  });

  it("returns an empty value when no readable name is available", () => {
    expect(creatorFirstName(null)).toBe("");
  });
});
