import { describe, expect, it, vi } from "vitest";
import { runAdminInvitationTransaction } from "./admin-invitation-transaction";

describe("runAdminInvitationTransaction", () => {
  it("prepara, approva e invia in ordine", async () => {
    const prepare = vi.fn();
    const approve = vi.fn();
    const send = vi.fn();
    const rollback = vi.fn();

    await runAdminInvitationTransaction({ prepare, approve, send, rollback });

    expect(prepare.mock.invocationCallOrder[0]).toBeLessThan(approve.mock.invocationCallOrder[0]);
    expect(approve.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]);
    expect(rollback).not.toHaveBeenCalled();
  });

  it("ripristina profilo e assegnazioni se una fase fallisce", async () => {
    const error = new Error("email");
    const rollback = vi.fn();

    await expect(runAdminInvitationTransaction({
      prepare: vi.fn(),
      approve: vi.fn(),
      send: vi.fn().mockRejectedValue(error),
      rollback,
    })).rejects.toBe(error);

    expect(rollback).toHaveBeenCalledOnce();
  });

  it("non nasconde un fallimento del ripristino", async () => {
    await expect(runAdminInvitationTransaction({
      prepare: vi.fn(),
      approve: vi.fn(),
      send: vi.fn().mockRejectedValue(new Error("email")),
      rollback: vi.fn().mockRejectedValue(new Error("database")),
    })).rejects.toThrow("ripristino");
  });
});
