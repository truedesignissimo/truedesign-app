import { describe, expect, it, vi } from "vitest";
import {
  submitRegistrationRequest,
  type RegistrationIdentity,
  type RegistrationRequestGateway,
} from "./registration-request";

const identity: RegistrationIdentity = {
  firstName: "Dario",
  lastName: "Breggie",
  fullName: "Dario Breggie",
  email: "dario@example.com",
};

function createGateway(): RegistrationRequestGateway {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    createPendingAccount: vi.fn().mockResolvedValue("new-user"),
    refreshPendingAccount: vi.fn().mockResolvedValue(undefined),
    notifyOwner: vi.fn().mockResolvedValue(undefined),
  };
}

describe("submitRegistrationRequest", () => {
  it("crea una nuova richiesta e notifica l'amministratore", async () => {
    const gateway = createGateway();

    const result = await submitRegistrationRequest(identity, gateway);

    expect(gateway.createPendingAccount).toHaveBeenCalledWith(identity);
    expect(gateway.notifyOwner).toHaveBeenCalledWith("new-user", identity);
    expect(result).toEqual({ status: "created", userId: "new-user" });
  });

  it("recupera una richiesta pending e reinvia la notifica", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.findByEmail).mockResolvedValue({
      id: "pending-user",
      status: "pending",
    });

    const result = await submitRegistrationRequest(identity, gateway);

    expect(gateway.createPendingAccount).not.toHaveBeenCalled();
    expect(gateway.refreshPendingAccount).toHaveBeenCalledWith("pending-user", identity);
    expect(gateway.notifyOwner).toHaveBeenCalledWith("pending-user", identity);
    expect(result).toEqual({ status: "recovered-pending", userId: "pending-user" });
  });

  it("riapre una richiesta rifiutata senza creare una nuova identità", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.findByEmail).mockResolvedValue({
      id: "rejected-user",
      status: "rejected",
    });

    const result = await submitRegistrationRequest(identity, gateway);

    expect(gateway.refreshPendingAccount).toHaveBeenCalledWith("rejected-user", identity);
    expect(result.status).toBe("recovered-pending");
  });

  it("non modifica un account già approvato", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.findByEmail).mockResolvedValue({
      id: "active-user",
      status: "approved",
    });

    const result = await submitRegistrationRequest(identity, gateway);

    expect(gateway.refreshPendingAccount).not.toHaveBeenCalled();
    expect(gateway.notifyOwner).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "already-active", userId: "active-user" });
  });

  it("mantiene la richiesta e segnala il fallimento della notifica", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.notifyOwner).mockRejectedValue(new Error("email provider"));

    const result = await submitRegistrationRequest(identity, gateway);

    expect(result).toEqual({ status: "notification-failed", userId: "new-user" });
  });
});
