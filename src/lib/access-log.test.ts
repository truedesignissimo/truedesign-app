import { describe, expect, it, vi } from "vitest";
import { recordAuthenticatedAccess } from "./access-log";

describe("recordAuthenticatedAccess", () => {
  it("records the authenticated user without accepting a client user id", async () => {
    const gateway = {
      getAuthenticatedUserId: vi.fn().mockResolvedValue("user-from-session"),
      insert: vi.fn().mockResolvedValue(undefined),
    };

    const result = await recordAuthenticatedAccess("homepage", gateway);

    expect(gateway.insert).toHaveBeenCalledWith("user-from-session", "homepage");
    expect(result).toEqual({ ok: true });
  });

  it("does not write when there is no authenticated session", async () => {
    const gateway = {
      getAuthenticatedUserId: vi.fn().mockResolvedValue(null),
      insert: vi.fn().mockResolvedValue(undefined),
    };

    const result = await recordAuthenticatedAccess("login", gateway);

    expect(gateway.insert).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "Sessione non disponibile." });
  });

  it("returns a controlled error when logging is unavailable", async () => {
    const gateway = {
      getAuthenticatedUserId: vi.fn().mockResolvedValue("user-1"),
      insert: vi.fn().mockRejectedValue(new Error("database")),
    };

    const result = await recordAuthenticatedAccess("login", gateway);

    expect(result).toEqual({ ok: false, error: "Accesso non registrato." });
  });
});
