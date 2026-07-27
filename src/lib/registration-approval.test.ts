import { describe, expect, it, vi } from "vitest";
import { approvePendingRegistration, type ApprovalGateway } from "./registration-approval";

function createGateway(overrides: Partial<ApprovalGateway> = {}): ApprovalGateway {
  return {
    getAccount: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "mario@example.com",
      fullName: "Mario Rossi",
      status: "pending",
    }),
    listActiveAppIds: vi.fn().mockResolvedValue(["app-1", "app-2"]),
    listAssignedAppIds: vi.fn().mockResolvedValue(["app-1"]),
    assignApps: vi.fn().mockResolvedValue(undefined),
    confirmEmail: vi.fn().mockResolvedValue(undefined),
    approveProfile: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("approvePendingRegistration", () => {
  it("assegna le app mancanti, conferma email e approva", async () => {
    const gateway = createGateway();
    const sendActivationEmail = vi.fn().mockResolvedValue(undefined);
    const result = await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      gateway,
      sendActivationEmail,
    });
    expect(gateway.assignApps).toHaveBeenCalledWith("user-1", ["app-2"]);
    expect(gateway.confirmEmail).toHaveBeenCalledWith("user-1");
    expect(gateway.approveProfile).toHaveBeenCalledWith("user-1", null);
    expect(result).toEqual({ status: "approved", appCount: 2, emailSent: true });
  });

  it("è idempotente per un account già approvato", async () => {
    const gateway = createGateway({
      getAccount: vi.fn().mockResolvedValue({
        id: "user-1", email: "mario@example.com", fullName: "Mario Rossi", status: "approved",
      }),
    });
    const result = await approvePendingRegistration({
      userId: "user-1", approvedBy: null, gateway, sendActivationEmail: vi.fn(),
    });
    expect(gateway.assignApps).not.toHaveBeenCalled();
    expect(result.status).toBe("already-approved");
  });

  it("non approva se l'assegnazione fallisce", async () => {
    const gateway = createGateway({
      assignApps: vi.fn().mockRejectedValue(new Error("database")),
    });
    await expect(approvePendingRegistration({
      userId: "user-1", approvedBy: null, gateway, sendActivationEmail: vi.fn(),
    })).rejects.toThrow("assegnare");
    expect(gateway.approveProfile).not.toHaveBeenCalled();
  });

  it("mantiene approvato l'account se fallisce solo la mail", async () => {
    const gateway = createGateway();
    const result = await approvePendingRegistration({
      userId: "user-1",
      approvedBy: null,
      gateway,
      sendActivationEmail: vi.fn().mockRejectedValue(new Error("email")),
    });
    expect(gateway.approveProfile).toHaveBeenCalled();
    expect(result.emailSent).toBe(false);
  });
});
