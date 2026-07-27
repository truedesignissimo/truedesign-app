import { describe, expect, it, vi } from "vitest";
import { deleteWorkspaceUser } from "./workspace-user-deletion";

function createGateway() {
  return {
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
    authUserExists: vi.fn().mockResolvedValue(false),
    deleteResidualData: vi.fn().mockResolvedValue(undefined),
  };
}

describe("deleteWorkspaceUser", () => {
  it("verifica Auth prima di pulire i dati residui", async () => {
    const gateway = createGateway();
    await deleteWorkspaceUser("user-1", gateway);
    expect(gateway.deleteAuthUser).toHaveBeenCalledWith("user-1");
    expect(gateway.authUserExists).toHaveBeenCalledWith("user-1");
    expect(gateway.deleteResidualData).toHaveBeenCalledWith("user-1");
    expect(gateway.authUserExists.mock.invocationCallOrder[0])
      .toBeLessThan(gateway.deleteResidualData.mock.invocationCallOrder[0]);
  });

  it("non comunica successo se l'identità Auth esiste ancora", async () => {
    const gateway = createGateway();
    gateway.authUserExists.mockResolvedValue(true);
    await expect(deleteWorkspaceUser("user-1", gateway))
      .rejects.toThrow("non è stato eliminato");
    expect(gateway.deleteResidualData).not.toHaveBeenCalled();
  });
});
