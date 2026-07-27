import { describe, expect, it } from "vitest";
import { createApprovalToken, verifyApprovalToken } from "./approval-token";

const NOW = Date.UTC(2026, 6, 27, 12);
const SECRET = "test-secret-with-at-least-32-characters";

describe("approval token", () => {
  it("valida un token per 72 ore", () => {
    const token = createApprovalToken("user-123", SECRET, NOW);
    expect(verifyApprovalToken(token, SECRET, NOW + 72 * 60 * 60 * 1000 - 1))
      .toEqual({ ok: true, userId: "user-123", expiresAt: NOW + 72 * 60 * 60 * 1000 });
  });

  it("rifiuta token alterati", () => {
    const token = createApprovalToken("user-123", SECRET, NOW);
    expect(verifyApprovalToken(`${token}x`, SECRET, NOW)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rifiuta token scaduti", () => {
    const token = createApprovalToken("user-123", SECRET, NOW);
    expect(verifyApprovalToken(token, SECRET, NOW + 72 * 60 * 60 * 1000 + 1))
      .toEqual({ ok: false, reason: "expired" });
  });
});
