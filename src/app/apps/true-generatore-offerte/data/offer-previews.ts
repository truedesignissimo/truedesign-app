import type { Offer } from "../domain/types";

type SignedImageReader = {
  getSignedImageUrl(path: string): Promise<string>;
};

export async function loadOfferPreviews(
  offer: Offer,
  imageStorage: SignedImageReader,
): Promise<Record<string, string>> {
  const entries = await Promise.all(offer.lines.map(async (line) => {
    if (!line.customImagePath) return null;
    try {
      const url = await imageStorage.getSignedImageUrl(line.customImagePath);
      return [line.id, url] as const;
    } catch {
      return null;
    }
  }));

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null));
}
