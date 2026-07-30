import { describe, expect, it, vi } from "vitest";
import { approvePendingRegistration, type ApprovalGateway } from "./registration-approval";

function createGateway(overrides: Partial<ApprovalGateway> = {}): ApprovalGateway {
  return {
    getAccount: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "mario@example.com",
      fullName: "Mario Rossi",
      userType: "cliente",
      status: "pending",
    }),
    listActiveApps: vi.fn().mockResolvedValue([
      { id: "app-1", url: "/apps/true-generatore-offerte" },
      { id: "survey", url: "/apps/true-sondaggio-iconici" },
    ]),
    listAssignedAppIds: vi.fn().mockResolvedValue([]),
    assignApps: vi.fn().mockResolvedValue(undefined),
    createPasswordSetupUrl: vi.fn().mockResolvedValue("https://supabase.test/recovery"),
    approveProfile: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("approvePendingRegistration", () => {
  it("assegna le app, approva e invia un link per scegliere la password", async () => {
    const gateway = createGateway();
    const sendActivationEmail = vi.fn().mockResolvedValue(undefined);
    const result = await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      siteUrl: "https://www.truedesign.app",
      gateway,
      sendActivationEmail,
    });
    expect(gateway.assignApps).toHaveBeenCalledWith("user-1", ["survey"]);
    expect(gateway.approveProfile).toHaveBeenCalledWith("user-1", null);
    expect(gateway.createPasswordSetupUrl).toHaveBeenCalledWith(
      "user-1",
      "https://www.truedesign.app"
    );
    expect(sendActivationEmail).toHaveBeenCalledWith({
      email: "mario@example.com",
      fullName: "Mario Rossi",
      appCount: 1,
      activationUrl: "https://supabase.test/recovery",
    });
    expect(result).toEqual({ status: "approved", appCount: 1, emailSent: true });
  });

  it("assegna tutte le app attive al team interno", async () => {
    const gateway = createGateway({
      getAccount: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "mario@truedesign.it",
        fullName: "Mario Rossi",
        userType: "interno",
        status: "pending",
      }),
    });

    await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      siteUrl: "https://www.truedesign.app",
      gateway,
      sendActivationEmail: vi.fn(),
    });

    expect(gateway.assignApps).toHaveBeenCalledWith("user-1", ["app-1", "survey"]);
  });

  it("è idempotente per un account già approvato", async () => {
    const gateway = createGateway({
      getAccount: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "mario@example.com",
        fullName: "Mario Rossi",
        userType: "cliente",
        status: "approved",
      }),
    });
    const result = await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      siteUrl: "https://www.truedesign.app",
      gateway,
      sendActivationEmail: vi.fn(),
    });
    expect(gateway.assignApps).not.toHaveBeenCalled();
    expect(result.status).toBe("already-approved");
  });

  it("non approva se l'assegnazione fallisce", async () => {
    const gateway = createGateway({
      assignApps: vi.fn().mockRejectedValue(new Error("database")),
    });
    await expect(approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      siteUrl: "https://www.truedesign.app",
      gateway,
      sendActivationEmail: vi.fn(),
    })).rejects.toThrow("assegnare");
    expect(gateway.approveProfile).not.toHaveBeenCalled();
  });

  it("mantiene approvato l'account se fallisce solo la mail", async () => {
    const gateway = createGateway();
    const result = await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      siteUrl: "https://www.truedesign.app",
      gateway,
      sendActivationEmail: vi.fn().mockRejectedValue(new Error("email")),
    });
    expect(gateway.approveProfile).toHaveBeenCalled();
    expect(result.emailSent).toBe(false);
  });
});
