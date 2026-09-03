import { describe, expect, it, vi } from "vitest";
import * as service from "./archive-service";

const RESPONSE_ID = "6f01ba7e-f275-4c52-8ff0-4f685ab4b44f";

describe("single response deletion", () => {
  it("exports the guarded deletion operation", () => {
    expect(service).toHaveProperty("runDeleteResponse", expect.any(Function));
  });

  it.each(["", "all", "6f01ba7e-f275-4c52-8ff0-4f685ab4b44f OR true"])("rejects invalid id %s", async (id) => {
    const gateway = { deleteResponse: vi.fn() };
    expect(await service.runDeleteResponse(id, "ELIMINA", gateway)).toMatchObject({ ok: false });
    expect(gateway.deleteResponse).not.toHaveBeenCalled();
  });

  it.each(["", "elimina", " ELIMINA", "ELIMINA "])("requires exact confirmation %s", async (confirmation) => {
    const gateway = { deleteResponse: vi.fn() };
    expect(await service.runDeleteResponse(RESPONSE_ID, confirmation, gateway)).toMatchObject({ ok: false });
    expect(gateway.deleteResponse).not.toHaveBeenCalled();
  });

  it("deletes exactly the requested id", async () => {
    const gateway = { deleteResponse: vi.fn().mockResolvedValue(true) };
    expect(await service.runDeleteResponse(RESPONSE_ID, "ELIMINA", gateway)).toEqual({ ok: true });
    expect(gateway.deleteResponse).toHaveBeenCalledExactlyOnceWith(RESPONSE_ID);
  });

  it("does not report success when the row was already removed", async () => {
    const gateway = { deleteResponse: vi.fn().mockResolvedValue(false) };
    expect(await service.runDeleteResponse(RESPONSE_ID, "ELIMINA", gateway)).toEqual({
      ok: false, error: "Risposta non trovata o già eliminata. Aggiorna la pagina.",
    });
  });

  it("propagates gateway errors to the server action's safe error boundary", async () => {
    const gateway = { deleteResponse: vi.fn().mockRejectedValue(new Error("unavailable")) };
    await expect(service.runDeleteResponse(RESPONSE_ID, "ELIMINA", gateway)).rejects.toThrow("unavailable");
  });
});
