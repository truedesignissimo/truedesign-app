import { describe, expect, it } from "vitest";
import {
  createApprovalToken,
  resolveApprovalSecret,
  verifyApprovalToken,
} from "./approval-token";

const NOW = Date.UTC(2026, 6, 27, 12);
const SECRET = "test-secret-with-at-least-32-characters";

describe("approval token", () => {
  it("uses the dedicated secret when configured", () => {
    expect(resolveApprovalSecret({
      APPROVAL_LINK_SECRET: "a".repeat(32),
      SUPABASE_SERVICE_ROLE_KEY: "b".repeat(32),
    })).toBe("a".repeat(32));
  });

  it("falls back to the server-only Supabase key", () => {
    expect(resolveApprovalSecret({
      SUPABASE_SERVICE_ROLE_KEY: "b".repeat(32),
    })).toBe("b".repeat(32));
  });

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
