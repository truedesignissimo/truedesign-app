export type PriceList = "ITAENG" | "ENGFRA";
export type OfferLanguage = "it" | "en" | "fr" | "de" | "he" | "zh" | "ar";

export type ProductConfiguration = Record<string, string | number | boolean | null>;

export interface OfferLine {
  id: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  pricesByList?: Partial<Record<PriceList, number>>;
  extras: number[];
  extrasByList?: Partial<Record<PriceList, number[]>>;
  discount: string;
  /** Compatibility field removed from newly-created payloads. */
  discountPercent?: number;
  manualSurcharge: number;
  note: string;
  configuration: ProductConfiguration;
  customImagePath?: string;
}

export interface OfferParty {
  name?: string;
  company?: string;
  vatNumber?: string;
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

export interface OfferSpecialOptions {
  class1IM: boolean;
  fireRetardant: boolean;
}

export interface Offer {
  schemaVersion: 3;
  id: string;
  userId: string;
  number: string;
  offerDate: string;
  validityDays: number;
  validUntil: string;
  priceList: PriceList;
  language: OfferLanguage;
  currency: "EUR";
  customer: OfferParty;
  project: OfferProject;
  salesRepresentative: string;
  paymentTerms: string;
  offerNotes: string;
  lines: OfferLine[];
  globalDiscount: string;
  /** Compatibility field removed from newly-created payloads. */
  globalDiscountPercent?: number;
  vatRate: number;
  showDiscounts: boolean;
  showNetPrices: boolean;
  specialOptions: OfferSpecialOptions;
  createdAt: string;
  updatedAt: string;
}

export interface OfferTotals {
  subtotal: number;
  discount: number;
  net: number;
  vat: number;
  total: number;
}
