import { describe, expect, it, vi } from "vitest";
import { createArchiveMessageHandler } from "./tetris-archive-bridge";

describe("True Tetris archive bridge", () => {
  it("ignores messages outside the True Tetris archive channel", async () => {
    const send = vi.fn();
    const handler = createArchiveMessageHandler({ repository: {} as never, send });

    await handler({ data: { channel: "other", action: "list" } } as MessageEvent);

    expect(send).not.toHaveBeenCalled();
  });

  it("returns a correlated list response", async () => {
    const send = vi.fn();
    const handler = createArchiveMessageHandler({
      repository: { list: vi.fn().mockResolvedValue([{ id: "shipment-1" }]) } as never,
      send,
    });

    await handler({
      data: { channel: "true-tetris-archive", requestId: "request-1", action: "list" },
    } as MessageEvent);

    expect(send).toHaveBeenCalledWith({
      channel: "true-tetris-archive",
      requestId: "request-1",
      ok: true,
      data: [{ id: "shipment-1" }],
    });
  });

  it("saves a packaging rule shared by every True Tetris user", async () => {
    const send = vi.fn();
    const savePackagingRule = vi.fn().mockResolvedValue({ code: "2214", length: 100, width: 50, height: 40 });
    const handler = createArchiveMessageHandler({
      repository: { savePackagingRule } as never,
      send,
    });

    await handler({
      data: {
        channel: "true-tetris-archive",
        requestId: "rule-1",
        action: "savePackagingRule",
        payload: { rule: { code: "2214", length: 100, width: 50, height: 40 } },
      },
    } as MessageEvent);

    expect(savePackagingRule).toHaveBeenCalledWith({ code: "2214", length: 100, width: 50, height: 40 });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ requestId: "rule-1", ok: true }));
  });
});
