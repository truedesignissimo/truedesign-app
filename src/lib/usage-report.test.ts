import { describe, expect, it } from "vitest";
import { buildUsageReport } from "./usage-report";

describe("buildUsageReport", () => {
  it("keeps workspace logins separate from app openings", () => {
    const report = buildUsageReport({
      accessLogs: [
        { id: "l1", user_id: "u1", source: "login", accessed_at: "2026-07-30T08:00:00Z" },
        { id: "l2", user_id: "u2", source: "homepage", accessed_at: "2026-07-30T09:00:00Z" },
      ],
      usageLogs: [
        { id: "o1", user_id: "u1", used_at: "2026-07-30T08:05:00Z", apps: { id: "a1", name: "Tetris Pallet" } },
        { id: "o2", user_id: "u1", used_at: "2026-07-30T08:10:00Z", apps: { id: "a2", name: "Generatore Offerte" } },
        { id: "o3", user_id: "u2", used_at: "2026-07-30T09:05:00Z", apps: { id: "a1", name: "Tetris Pallet" } },
      ],
      users: [
        { id: "u1", email: "dario@truedesign.it" },
        { id: "u2", email: "valentina@truedesign.it" },
      ],
      profiles: [
        { id: "u1", full_name: "Dario Breggie" },
        { id: "u2", full_name: "Valentina Marchioro" },
      ],
    });

    expect(report.totalLogins).toBe(2);
    expect(report.totalAppOpens).toBe(3);
    expect(report.loginUsers).toEqual([
      { userId: "u1", label: "Dario Breggie", email: "dario@truedesign.it", value: 1 },
      { userId: "u2", label: "Valentina Marchioro", email: "valentina@truedesign.it", value: 1 },
    ]);
    expect(report.appUsers).toHaveLength(2);
    expect(report.byApp[0]).toEqual({ label: "Tetris Pallet", value: 2 });
  });

  it("falls back to email when a profile name is missing", () => {
    const report = buildUsageReport({
      accessLogs: [
        { id: "l1", user_id: "u1", source: "login", accessed_at: "2026-07-30T08:00:00Z" },
      ],
      usageLogs: [],
      users: [{ id: "u1", email: "guest@example.com" }],
      profiles: [],
    });

    expect(report.loginUsers[0].label).toBe("guest@example.com");
  });
});
