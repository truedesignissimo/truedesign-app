import { describe, expect, it, vi } from "vitest";
import { loadCatalog } from "./catalog";

describe("loadCatalog", () => {
  it("loads and validates static products, fabrics and metadata", async () => {
    const responses: Record<string, unknown> = {
      "products.json": [{ code: "AB 1000", family: "ABISKO", prices: { S: 1000 }, prices_EF: { S: 1200 } }],
      "fabrics.json": { version: "fixture", fabrics: [{ id: "fab-1", category: "S" }] },
      "catalog-meta.json": { finish_palettes: { wood: ["Ashwood"] } },
      "catalog-manifest.json": { version: "next-v1", productCount: 1, fabricCount: 1 },
    };
    const fetcher = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => responses[url.split("/").pop()!],
    })) as unknown as typeof fetch;

    const catalog = await loadCatalog(fetcher);

    expect(catalog.products[0].code).toBe("AB 1000");
    expect(catalog.fabrics.fabrics[0].id).toBe("fab-1");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("rejects a partial catalog instead of exposing incomplete prices", async () => {
    const fetcher = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith("products.json") ? [] : url.endsWith("catalog-manifest.json")
        ? { version: "next-v1", productCount: 1, fabricCount: 0 }
        : url.endsWith("fabrics.json") ? { version: "fixture", fabrics: [] } : {},
    })) as unknown as typeof fetch;

    await expect(loadCatalog(fetcher)).rejects.toThrow("Catalogo prodotti incompleto");
  });
});
