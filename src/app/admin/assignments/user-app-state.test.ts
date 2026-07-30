import { describe, expect, it } from "vitest";
import { replaceUserAssignments } from "./user-app-state";

describe("replaceUserAssignments", () => {
  it("replaces only the selected user's assignments", () => {
    const current = [
      { user_id: "user-1", app_id: "old" },
      { user_id: "user-2", app_id: "other" },
    ];

    expect(replaceUserAssignments(current, "user-1", ["app-a", "app-b"])).toEqual([
      { user_id: "user-2", app_id: "other" },
      { user_id: "user-1", app_id: "app-a" },
      { user_id: "user-1", app_id: "app-b" },
    ]);
  });

  it("removes every assignment for the selected user", () => {
    const current = [
      { user_id: "user-1", app_id: "old" },
      { user_id: "user-2", app_id: "other" },
    ];

    expect(replaceUserAssignments(current, "user-1", [])).toEqual([
      { user_id: "user-2", app_id: "other" },
    ]);
  });
});
