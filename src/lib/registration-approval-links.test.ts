import { describe, expect, it } from "vitest";
import { buildApprovalUrl } from "./registration-approval-links";
import { verifyApprovalToken } from "./approval-token";

describe("buildApprovalUrl", () => {
  it("crea un link interno firmato per l'utente", () => {
    const secret = "test-secret-with-at-least-32-characters";
    const url = new URL(buildApprovalUrl(
      "user-123",
      secret,
      "https://www.truedesign.app",
      Date.UTC(2026, 6, 27)
    ));
    expect(url.origin).toBe("https://www.truedesign.app");
    expect(url.pathname).toBe("/approva-utente");
    expect(verifyApprovalToken(url.searchParams.get("token")!, secret).ok).toBe(true);
  });
});
