import { describe, expect, it, vi } from "vitest";
import {
  buildPasswordSetupUrl,
  generatePasswordSetupUrl,
} from "./password-setup-url";

describe("password setup URL", () => {
  it("porta al form interno senza passare dal callback PKCE", () => {
    const url = new URL(buildPasswordSetupUrl(
      "https://www.truedesign.app",
      "hashed-token"
    ));

    expect(url.origin).toBe("https://www.truedesign.app");
    expect(url.pathname).toBe("/imposta-password");
    expect(url.searchParams.get("token_hash")).toBe("hashed-token");
    expect(url.searchParams.get("type")).toBe("recovery");
    expect(url.pathname).not.toBe("/auth/callback");
  });

  it("usa il token hash generato da Supabase e non l'action link", async () => {
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: "https://supabase.test/auth/v1/verify?token=one-time",
          hashed_token: "hashed-token",
          verification_type: "recovery",
        },
      },
      error: null,
    });

    const result = await generatePasswordSetupUrl(
      { admin: { generateLink } },
      "mario@example.com",
      "https://www.truedesign.app"
    );

    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "mario@example.com",
    });
    expect(result).toBe(
      "https://www.truedesign.app/imposta-password?token_hash=hashed-token&type=recovery"
    );
    expect(result).not.toContain("supabase.test");
  });
});
