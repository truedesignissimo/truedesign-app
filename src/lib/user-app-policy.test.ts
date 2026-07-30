import { describe, expect, it } from "vitest";
import { assignmentDelta, defaultAppIdsForRole } from "./user-app-policy";

const apps = [
  { id: "offers", url: "/apps/true-generatore-offerte" },
  { id: "survey", url: "/apps/true-sondaggio-iconici" },
];

describe("default app assignments", () => {
  it("assigns every active app to internal users", () => {
    expect(defaultAppIdsForRole("interno", apps)).toEqual(["offers", "survey"]);
  });

  it("assigns only the iconic products survey to clients", () => {
    expect(defaultAppIdsForRole("cliente", apps)).toEqual(["survey"]);
  });
});

describe("assignment delta", () => {
  it("returns only additions and removals", () => {
    expect(assignmentDelta(["offers", "legacy"], ["offers", "survey"])).toEqual({
      add: ["survey"],
      remove: ["legacy"],
    });
  });

  it("does not write when the assignment already matches", () => {
    expect(assignmentDelta(["offers"], ["offers"])).toEqual({
      add: [],
      remove: [],
    });
  });
});
