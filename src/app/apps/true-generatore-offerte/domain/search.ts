import type { CatalogProduct } from "../data/catalog";

const text = (value: unknown): string => String(value ?? "").toLocaleLowerCase("it");

export function searchProducts(products: CatalogProduct[], query: string, limit = 40): CatalogProduct[] {
  const needle = text(query).trim();
  if (!needle) return [];
  return products
    .map((product) => {
      const code = text(product.code);
      const family = text(product.family);
      const name = `${text(product.name_it)} ${text(product.name)}`;
      let score = 0;
      if (code === needle) score += 1000;
      else if (code.startsWith(needle)) score += 600;
      else if (code.includes(needle)) score += 350;
      if (family.startsWith(needle)) score += 240;
      else if (family.includes(needle)) score += 120;
      if (name.includes(needle)) score += 80;
      if (product.isAccessory) score -= 20;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(a.product.isAccessory)) - Number(Boolean(b.product.isAccessory)) || a.product.code.localeCompare(b.product.code))
    .slice(0, limit)
    .map(({ product }) => product);
}
