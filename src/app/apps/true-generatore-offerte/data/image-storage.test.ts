import { describe, expect, it, vi } from "vitest";
import { createImageStorage } from "./image-storage";

const image = (overrides: Partial<File> = {}) => ({
  name: "prodotto custom.png", type: "image/png", size: 1024,
  arrayBuffer: async () => new ArrayBuffer(0), ...overrides,
}) as File;

describe("custom image storage", () => {
  it("uploads into the authenticated user's private prefix", async () => {
    const upload = vi.fn(async () => ({ data: { path: "user-1/offer-1/line-1/image.png" }, error: null }));
    const storage = createImageStorage({ storage: { from: () => ({ upload }) } } as never);
    const path = await storage.uploadLineImage({ userId: "user-1", offerId: "offer-1", lineId: "line-1", file: image() });
    expect(path).toMatch(/^user-1\/offer-1\/line-1\//);
    expect(upload).toHaveBeenCalledOnce();
  });

  it("rejects unsupported or oversized files before upload", async () => {
    const upload = vi.fn();
    const storage = createImageStorage({ storage: { from: () => ({ upload }) } } as never);
    await expect(storage.uploadLineImage({ userId: "u", offerId: "o", lineId: "l", file: image({ type: "image/svg+xml" }) })).rejects.toThrow("JPEG, PNG o WebP");
    await expect(storage.uploadLineImage({ userId: "u", offerId: "o", lineId: "l", file: image({ size: 10 * 1024 * 1024 + 1 }) })).rejects.toThrow("10 MB");
    expect(upload).not.toHaveBeenCalled();
  });
});
