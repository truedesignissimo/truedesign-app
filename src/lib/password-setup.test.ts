import { describe, expect, it, vi } from "vitest";
import { completePasswordSetup } from "./password-setup";

describe("completePasswordSetup", () => {
  it("verifica il recovery token solo quando salva la nuova password", async () => {
    const gateway = {
      verifyRecoveryToken: vi.fn().mockResolvedValue(true),
      updatePassword: vi.fn().mockResolvedValue(true),
    };

    const result = await completePasswordSetup({
      tokenHash: "hashed-token",
      password: "password-sicura",
      gateway,
    });

    expect(gateway.verifyRecoveryToken).toHaveBeenCalledWith("hashed-token");
    expect(gateway.updatePassword).toHaveBeenCalledWith("password-sicura");
    expect(result).toEqual({ ok: true });
  });

  it("non modifica la password se il token non è valido", async () => {
    const gateway = {
      verifyRecoveryToken: vi.fn().mockResolvedValue(false),
      updatePassword: vi.fn(),
    };

    const result = await completePasswordSetup({
      tokenHash: "invalid-token",
      password: "password-sicura",
      gateway,
    });

    expect(gateway.updatePassword).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: "Il link non è valido o è scaduto. Richiedi una nuova email.",
    });
  });
});
