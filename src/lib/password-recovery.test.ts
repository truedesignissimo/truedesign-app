import { describe, expect, it, vi } from "vitest";
import { requestPasswordRecovery } from "./password-recovery";

describe("requestPasswordRecovery", () => {
  it("non rivela un indirizzo inesistente e non invia email", async () => {
    const gateway = {
      findActiveAccount: vi.fn().mockResolvedValue(null),
      createRecoveryUrl: vi.fn(),
      sendRecoveryEmail: vi.fn(),
    };

    await expect(requestPasswordRecovery("unknown@example.com", gateway)).resolves.toEqual({ ok: true });
    expect(gateway.createRecoveryUrl).not.toHaveBeenCalled();
    expect(gateway.sendRecoveryEmail).not.toHaveBeenCalled();
  });

  it("invia un link diretto solo a un account attivo", async () => {
    const gateway = {
      findActiveAccount: vi.fn().mockResolvedValue({
        email: "mario@example.com",
        firstName: "Mario",
      }),
      createRecoveryUrl: vi.fn().mockResolvedValue("https://www.truedesign.app/imposta-password?token_hash=abc&type=recovery"),
      sendRecoveryEmail: vi.fn().mockResolvedValue(undefined),
    };

    await expect(requestPasswordRecovery(" MARIO@example.com ", gateway)).resolves.toEqual({ ok: true });
    expect(gateway.findActiveAccount).toHaveBeenCalledWith("mario@example.com");
    expect(gateway.createRecoveryUrl).toHaveBeenCalledWith("mario@example.com");
    expect(gateway.sendRecoveryEmail).toHaveBeenCalledWith({
      email: "mario@example.com",
      firstName: "Mario",
      recoveryUrl: "https://www.truedesign.app/imposta-password?token_hash=abc&type=recovery",
    });
  });
});
