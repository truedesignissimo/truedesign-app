const CATALOG_BASE = "/apps/true-generatore-offerte/data";

export interface CatalogProduct {
  code: string;
  family: string;
  name?: string;
  name_it?: string;
  prices?: Record<string, number | null>;
  prices_EF?: Record<string, number | null>;
  imagePath?: string;
  productPhotoPath?: string;
  [key: string]: unknown;
}

export interface FabricRecord {
  id: string;
  category?: string;
  swatchPath?: string;
  [key: string]: unknown;
}

export interface FabricCatalog {
  version: string;
  fabrics: FabricRecord[];
}

export interface CatalogManifest {
  version: "next-v1";
  productCount: number;
  fabricCount: number;
  sourceHashes?: Record<string, string>;
}

export interface Catalog {
  products: CatalogProduct[];
  fabrics: FabricCatalog;
  metadata: Record<string, unknown>;
  manifest: CatalogManifest;
}

async function readJson<T>(fetcher: typeof fetch, filename: string): Promise<T> {
  const response = await fetcher(`${CATALOG_BASE}/${filename}`);
  if (!response.ok) throw new Error(`Impossibile caricare ${filename}`);
  return response.json() as Promise<T>;
}

export async function loadCatalog(fetcher: typeof fetch = fetch): Promise<Catalog> {
  const [products, fabrics, metadata, manifest] = await Promise.all([
    readJson<CatalogProduct[]>(fetcher, "products.json"),
    readJson<FabricCatalog>(fetcher, "fabrics.json"),
    readJson<Record<string, unknown>>(fetcher, "catalog-meta.json"),
    readJson<CatalogManifest>(fetcher, "catalog-manifest.json"),
  ]);
  if (manifest.version !== "next-v1") throw new Error("Versione catalogo non supportata");
  if (!Array.isArray(products) || products.length !== manifest.productCount) {
    throw new Error("Catalogo prodotti incompleto");
  }
  if (!Array.isArray(fabrics.fabrics) || fabrics.fabrics.length !== manifest.fabricCount) {
    throw new Error("Catalogo tessuti incompleto");
  }
  return { products, fabrics, metadata, manifest };
}
