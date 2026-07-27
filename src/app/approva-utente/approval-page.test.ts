import { describe, expect, it } from "vitest";
import { getApprovalPageState } from "./approval-page-state";

describe("approval page state", () => {
  it("distingue link valido, scaduto e non valido", () => {
    expect(getApprovalPageState({ ok: true, userId: "u1", expiresAt: 1 }))
      .toEqual({ kind: "ready", title: "Approva questo utente", userId: "u1" });
    expect(getApprovalPageState({ ok: false, reason: "expired" }).kind).toBe("expired");
    expect(getApprovalPageState({ ok: false, reason: "invalid" }).kind).toBe("invalid");
  });
});
