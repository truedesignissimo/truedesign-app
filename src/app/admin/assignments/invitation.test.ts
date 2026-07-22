import { describe, expect, it, vi } from "vitest";
import { provisionAdminUser } from "./invitation";

function createAuth(overrides: Record<string, unknown> = {}) {
  return {
    admin: {
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-user", email: "nuovo@example.com", email_confirmed_at: "now" } },
        error: null,
      }),
      updateUserById: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    ...overrides,
  };
}

describe("provisionAdminUser", () => {
  it("crea un utente senza password e invia il link per sceglierla", async () => {
    const auth = createAuth();

    const result = await provisionAdminUser(auth, {
      email: "nuovo@example.com",
      fullName: "Nuovo Utente",
      userType: "cliente",
      redirectTo: "https://www.truedesign.app/auth/callback?next=%2Fimposta-password",
      existingUser: null,
    });

    expect(auth.admin.createUser).toHaveBeenCalledWith({
      email: "nuovo@example.com",
      email_confirm: true,
      user_metadata: { full_name: "Nuovo Utente", user_type: "cliente" },
    });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("nuovo@example.com", {
      redirectTo: "https://www.truedesign.app/auth/callback?next=%2Fimposta-password",
    });
    expect(result).toMatchObject({ created: true, user: { id: "new-user" } });
  });

  it("abilita un account importato non confermato prima di inviare il link", async () => {
    const auth = createAuth();

    await provisionAdminUser(auth, {
      email: "esistente@example.com",
      fullName: "Utente Esistente",
      userType: "interno",
      redirectTo: "https://www.truedesign.app/auth/callback?next=%2Fimposta-password",
      existingUser: { id: "existing-user", email: "esistente@example.com", email_confirmed_at: null },
    });

    expect(auth.admin.createUser).not.toHaveBeenCalled();
    expect(auth.admin.updateUserById).toHaveBeenCalledWith("existing-user", {
      email_confirm: true,
      user_metadata: { full_name: "Utente Esistente", user_type: "interno" },
    });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledOnce();
  });

  it("elimina il nuovo account se la mail non può essere inviata", async () => {
    const auth = createAuth({
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: { message: "SMTP error" },
      }),
    });

    await expect(
      provisionAdminUser(auth, {
        email: "nuovo@example.com",
        fullName: "Nuovo Utente",
        userType: "cliente",
        redirectTo: "https://www.truedesign.app/auth/callback?next=%2Fimposta-password",
        existingUser: null,
      })
    ).rejects.toThrow("email");

    expect(auth.admin.deleteUser).toHaveBeenCalledWith("new-user");
  });
});
