import { describe, expect, it, vi } from "vitest";
import { createTetrisShipmentsRepository } from "./shipments-repository";

describe("Tetris shipments repository", () => {
  it("saves the full pallet plan independently from the source file", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "shipment-1", payload: { id: "shipment-1", plan: { pallets: [] } } },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const upsert = vi.fn(() => ({ select }));
    const repository = createTetrisShipmentsRepository({ from: vi.fn(() => ({ upsert })) } as never);

    await expect(repository.save({
      id: "shipment-1",
      title: "Ordine 1419",
      metadata: {},
      settings: {},
      plan: { pallets: [] },
      summary: {},
    })).resolves.toMatchObject({ id: "shipment-1" });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: "shipment-1",
      source_file_path: null,
      payload: expect.objectContaining({ plan: { pallets: [] } }),
    }));
  });

  it("rejects a source file that is not XLSX or CSV", async () => {
    const repository = createTetrisShipmentsRepository({ storage: { from: vi.fn() } } as never);

    await expect(repository.uploadSourceFile(
      "shipment-1",
      new File(["x"], "note.pdf", { type: "application/pdf" }),
    )).rejects.toThrow("Sono supportati soltanto file XLSX o CSV");
  });
});
