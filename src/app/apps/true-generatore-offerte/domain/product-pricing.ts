import type { CatalogProduct, FabricRecord } from "../data/catalog";
import type { OfferLine, PriceList } from "./types";

export interface PriceChoice {
  id: string;
  label: string;
  ITAENG: number;
  ENGFRA: number;
  finishId?: string;
  category?: string;
}
export interface ExtraChoice {
  id: string;
  note?: string;
  ITAENG?: number;
  ENGFRA?: number;
}
interface RawChoice {
  id?: string;
  name?: string;
  price?: number | null;
  price_EF?: number | null;
  prices?: Record<string, number | null>;
}

const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const FABRIC_CATEGORIES = ["S", "T", "M", "F", "L", "P", "PX"];
const fabricCollectionKey = (value: unknown): string => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+by\s+.+$/i, "")
  .trim()
  .toUpperCase();

export function fabricCategoryForProduct(product: CatalogProduct, fabric: FabricRecord): string {
  const categories = (product.fabricCollectionCategories as Record<string, string> | undefined) ?? {};
  const normalized = Object.entries(categories).reduce<Record<string, string>>((result, [collection, category]) => {
    result[fabricCollectionKey(collection)] = category;
    return result;
  }, {});
  return normalized[fabricCollectionKey(fabric.collection)] ?? String(fabric.category ?? "");
}

export function effectiveFabricCategory(
  product: CatalogProduct,
  fabric: FabricRecord,
  class1IM: boolean,
): string {
  const category = fabricCategoryForProduct(product, fabric);
  if (!class1IM) return category;
  const index = FABRIC_CATEGORIES.indexOf(category);
  return index >= 0 && index < FABRIC_CATEGORIES.length - 1 ? FABRIC_CATEGORIES[index + 1] : category;
}

export function allowedFabricsForProduct(product: CatalogProduct, fabrics: FabricRecord[]): FabricRecord[] {
  const categories = (product.fabricCollectionCategories as Record<string, string> | undefined) ?? {};
  const allowed = new Set(Object.keys(categories).map(fabricCollectionKey));
  return allowed.size
    ? fabrics.filter((fabric) => allowed.has(fabricCollectionKey(fabric.collection)))
    : fabrics;
}

export function getPriceChoices(product: CatalogProduct): PriceChoice[] {
  const finishes = (product.finishes as RawChoice[] | null | undefined) ?? [];
  const finishesEf = (product.finishes_EF as RawChoice[] | null | undefined) ?? [];
  const multiFinishChoices = finishes.flatMap((finish) => {
    if (!finish.prices) return [];
    const finishEf = finishesEf.find((item) => item.id === finish.id);
    return Object.keys(finish.prices).flatMap((category) => {
      const ita = number(finish.prices?.[category]);
      const fra = number(finishEf?.prices?.[category]);
      return ita === null || fra === null ? [] : [{
        id: `${finish.id ?? "base"}::${category}`,
        label: `${finish.name ?? finish.id ?? "Finitura"} - Categoria ${category}`,
        finishId: finish.id ?? "base",
        category,
        ITAENG: ita,
        ENGFRA: fra,
      }];
    });
  });
  if (multiFinishChoices.length) {
    const alternativeChoices = ((product.priceOptions as RawChoice[] | undefined) ?? []).flatMap((choice) => {
      const ita = number(choice.price);
      const fra = number(choice.price_EF);
      return ita === null || fra === null ? [] : [{
        id: `option::${choice.id ?? choice.name ?? "base"}`,
        label: choice.name ?? choice.id ?? "Versione alternativa",
        finishId: choice.id,
        ITAENG: ita,
        ENGFRA: fra,
      }];
    });
    return [...multiFinishChoices, ...alternativeChoices];
  }

  const priceOptions = (product.priceOptions as RawChoice[] | undefined) ?? [];
  if (priceOptions.length) {
    const choices = priceOptions.flatMap((choice) => {
      const ita = number(choice.price);
      const fra = number(choice.price_EF);
      return ita === null || fra === null ? [] : [{ id: choice.id ?? choice.name ?? "base", label: choice.name ?? choice.id ?? "Prezzo base", ITAENG: ita, ENGFRA: fra }];
    });
    if (choices.length) return choices;
  }

  if (finishes.length) {
    const choices = finishes.flatMap((choice) => {
      const matchingEf = finishesEf.find((item) => item.id === choice.id);
      const ita = number(choice.price);
      const fra = number(choice.price_EF) ?? number(matchingEf?.price);
      return ita === null || fra === null ? [] : [{ id: choice.id ?? choice.name ?? "base", label: choice.name ?? choice.id ?? "Prezzo base", ITAENG: ita, ENGFRA: fra }];
    });
    if (choices.length) return choices;
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

export function freeQuantityThreshold(extra: Pick<ExtraChoice, "note">): number | null {
  const match = String(extra.note ?? "").match(/gratuit[oa]\s+(?:oltre|da)\s+(?:i\s+)?(\d+)\s*p/i);
  return match ? Number(match[1]) : null;
}

export function extraAmount(
  extra: { amount: number; freeFromQuantity?: number | null },
  quantity: number,
  waived: boolean,
): number {
  if (waived) return 0;
  if (extra.freeFromQuantity != null && quantity >= extra.freeFromQuantity) return 0;
  return extra.amount;
}

export function createLineFromProduct(product: CatalogProduct, priceList: PriceList, id = crypto.randomUUID()): OfferLine {
  const choice = getPriceChoices(product)[0];
  if (!choice) throw new Error(`Nessun prezzo configurabile per ${product.code}: ricontrollare il PDF ufficiale`);
  const componentDefaults = ((product.componentGroups as Array<{ id: string; options?: Array<{ id: string }> }> | undefined) ?? [])
    .reduce<Record<string, string>>((result, group) => {
      if (group.options?.[0]) result[`component:${group.id}`] = group.options[0].id;
      return result;
    }, {});
  return {
    id, productCode: product.code, quantity: 1, unitPrice: choice[priceList],
    pricesByList: { ITAENG: choice.ITAENG, ENGFRA: choice.ENGFRA }, extras: [],
    extrasByList: { ITAENG: [], ENGFRA: [] }, discount: "0",
    manualSurcharge: 0, note: "",
    configuration: {
      ...componentDefaults,
      priceChoice: choice.id,
      finishId: choice.finishId ?? null,
      category: choice.category ?? null,
      pricingMode: choice.id.startsWith("option::") ? "option" : (product.has_fabric ? "fabric" : "standard"),
      fabricManufacturer: "",
      fabricId: "",
      extraId: "",
      waiveExtraCharge: false,
      class1IM: false,
      fireRetardant: false,
    },
  };
}

export function selectedExtraAmounts(
  extras: ExtraChoice[],
  configuration: OfferLine["configuration"],
  priceList: PriceList,
  quantity = 1,
): number[] {
  const selectedId = String(configuration.extraId ?? "");
  const waived = Boolean(configuration.waiveExtraCharge);
  return extras.flatMap((extra) => {
    const amount = number(extra[priceList]);
    const selected = selectedId ? selectedId === extra.id : configuration[`extra:${extra.id}`] === true;
    return selected && amount !== null ? [extraAmount({
      amount,
      freeFromQuantity: freeQuantityThreshold(extra),
    }, quantity, waived)] : [];
  });
}
