import type { CatalogProduct } from "../data/catalog";
import type { OfferLine, PriceList } from "./types";

export interface PriceChoice { id: string; label: string; ITAENG: number; ENGFRA: number }
export interface ExtraChoice { id: string; ITAENG?: number; ENGFRA?: number }
interface RawChoice { id?: string; name?: string; price?: number | null; price_EF?: number | null }

const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

export function getPriceChoices(product: CatalogProduct): PriceChoice[] {
  for (const key of ["priceOptions", "finishes"] as const) {
    const raw = product[key] as RawChoice[] | undefined;
    if (raw?.length) return raw.flatMap((choice) => {
      const ita = number(choice.price); const fra = number(choice.price_EF);
      return ita === null || fra === null ? [] : [{ id: choice.id ?? choice.name ?? "base", label: choice.name ?? choice.id ?? "Prezzo base", ITAENG: ita, ENGFRA: fra }];
    });
  }
  const ita = product.prices ?? {};
  const fra = product.prices_EF ?? {};
  const categories = Object.keys(ita).flatMap((category) => {
    const itaPrice = number(ita[category]); const fraPrice = number(fra[category]);
    return itaPrice === null || fraPrice === null ? [] : [{ id: category, label: `Categoria ${category}`, ITAENG: itaPrice, ENGFRA: fraPrice }];
  });
  if (categories.length) return categories;
  const fixedIta = number(product.fixedPrice); const fixedFra = number(product.fixedPrice_EF);
  return fixedIta !== null && fixedFra !== null ? [{ id: "base", label: "Prezzo base", ITAENG: fixedIta, ENGFRA: fixedFra }] : [];
}

export function createLineFromProduct(product: CatalogProduct, priceList: PriceList, id = crypto.randomUUID()): OfferLine {
  const choice = getPriceChoices(product)[0];
  if (!choice) throw new Error(`Nessun prezzo configurabile per ${product.code}: ricontrollare il PDF ufficiale`);
  return {
    id, productCode: product.code, quantity: 1, unitPrice: choice[priceList],
    pricesByList: { ITAENG: choice.ITAENG, ENGFRA: choice.ENGFRA }, extras: [],
    extrasByList: { ITAENG: [], ENGFRA: [] }, discountPercent: 0,
    configuration: { priceChoice: choice.id },
  };
}

export function selectedExtraAmounts(
  extras: ExtraChoice[],
  configuration: OfferLine["configuration"],
  priceList: PriceList,
): number[] {
  return extras.flatMap((extra) => {
    const amount = number(extra[priceList]);
    return configuration[`extra:${extra.id}`] === true && amount !== null ? [amount] : [];
  });
}
