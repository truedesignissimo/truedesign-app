import { describe, expect, it, vi } from "vitest";
import type { Offer } from "../domain/types";
import { loadOfferPreviews } from "./offer-previews";

describe("loadOfferPreviews", () => {
  it("loads signed URLs only for lines with a stored custom image", async () => {
    const offer = {
      lines: [
        { id: "line-a", customImagePath: "user/offer/line-a/photo.webp" },
        { id: "line-b" },
      ],
    } as Offer;
    const getSignedImageUrl = vi.fn(async (path: string) => `signed:${path}`);

    await expect(loadOfferPreviews(offer, { getSignedImageUrl })).resolves.toEqual({
      "line-a": "signed:user/offer/line-a/photo.webp",
    });
    expect(getSignedImageUrl).toHaveBeenCalledTimes(1);
  });

  it("keeps the usable previews when one signed URL cannot be created", async () => {
    const offer = {
      lines: [
        { id: "line-a", customImagePath: "available.webp" },
        { id: "line-b", customImagePath: "missing.webp" },
      ],
    } as Offer;
    const getSignedImageUrl = vi.fn(async (path: string) => {
      if (path === "missing.webp") throw new Error("not found");
      return `signed:${path}`;
    });

    await expect(loadOfferPreviews(offer, { getSignedImageUrl })).resolves.toEqual({
      "line-a": "signed:available.webp",
    });
  });
});
