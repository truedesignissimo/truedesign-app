export type PriceList = "ITAENG" | "ENGFRA";

export type ProductConfiguration = Record<string, string | number | boolean | null>;

export interface OfferLine {
  id: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  pricesByList?: Partial<Record<PriceList, number>>;
  extras: number[];
  discountPercent: number;
  configuration: ProductConfiguration;
  customImagePath?: string;
}

export interface OfferParty {
  name?: string;
  company?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface OfferProject {
  reference?: string;
  contact?: string;
  validUntil?: string;
  notes?: string;
}

export interface Offer {
  id: string;
  userId: string;
  number: string;
  priceList: PriceList;
  currency: "EUR";
  customer: OfferParty;
  project: OfferProject;
  lines: OfferLine[];
  globalDiscountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfferTotals {
  subtotal: number;
  discount: number;
  total: number;
}
