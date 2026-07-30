import { describe, expect, it, vi } from "vitest";
import { provisionAdminUser } from "./invitation";

function createAuth(overrides: Record<string, unknown> = {}) {
  return {
    admin: {
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-user", email: "nuovo@example.com", email_confirmed_at: null } },
        error: null,
      }),
      updateUserById: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      generateLink: vi.fn().mockResolvedValue({
        data: {
          properties: {
            hashed_token: "hashed-token",
            action_link: "https://supabase.test/auth/v1/verify",
            verification_type: "recovery",
          },
        },
        error: null,
      }),
    },
    ...overrides,
  };
}

describe("provisionAdminUser", () => {
  it("crea un utente non confermato e prepara il link per sceglierla", async () => {
    const auth = createAuth();

    const result = await provisionAdminUser(auth, {
      email: "nuovo@example.com",
      fullName: "Nuovo Utente",
      userType: "cliente",
      siteUrl: "https://www.truedesign.app",
      existingUser: null,
    });

    expect(auth.admin.createUser).toHaveBeenCalledWith({
      email: "nuovo@example.com",
      email_confirm: false,
      user_metadata: { full_name: "Nuovo Utente", user_type: "cliente" },
    });
    expect(auth.admin.generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "nuovo@example.com",
    });
    expect(result).toMatchObject({
      created: true,
      user: { id: "new-user" },
      activationUrl:
        "https://www.truedesign.app/imposta-password?token_hash=hashed-token&type=recovery",
    });
  });

  it("aggiorna un account importato senza confermarne automaticamente l'email", async () => {
    const auth = createAuth();

    await provisionAdminUser(auth, {
      email: "esistente@example.com",
      fullName: "Utente Esistente",
      userType: "interno",
      siteUrl: "https://www.truedesign.app",
      existingUser: { id: "existing-user", email: "esistente@example.com", email_confirmed_at: null },
    });

    expect(auth.admin.createUser).not.toHaveBeenCalled();
    expect(auth.admin.updateUserById).toHaveBeenCalledWith("existing-user", {
      user_metadata: { full_name: "Utente Esistente", user_type: "interno" },
    });
    expect(auth.admin.generateLink).toHaveBeenCalledOnce();
  });

  it("elimina il nuovo account se la mail non può essere inviata", async () => {
    const auth = createAuth({
      admin: {
        ...createAuth().admin,
        generateLink: vi.fn().mockResolvedValue({
          data: { properties: null },
          error: { message: "Link error" },
        }),
      },
    });

    await expect(
      provisionAdminUser(auth, {
        email: "nuovo@example.com",
        fullName: "Nuovo Utente",
        userType: "cliente",
        siteUrl: "https://www.truedesign.app",
        existingUser: null,
      })
    ).rejects.toThrow("email");

    expect(auth.admin.deleteUser).toHaveBeenCalledWith("new-user");
  });
});
