import { describe, expect, it } from "vitest";
import {
  configurationLines,
  fitImage,
  metadataLines,
  resolveLineImageUrl,
} from "./build-offer-pdf";
import { createEmptyOffer } from "../state/offer-reducer";
import type { CatalogProduct } from "../data/catalog";
import type { OfferLine } from "../domain/types";

describe("fitImage", () => {
  it("fits landscape images without stretching", () => {
    expect(fitImage(1200, 600, 40, 40)).toEqual({ width: 40, height: 20 });
  });

  it("fits portrait images without stretching", () => {
    expect(fitImage(600, 1200, 40, 30)).toEqual({ width: 15, height: 30 });
  });
});

const product = {
  code: "AB 1000",
  family: "ABISKO",
  name_it: "poltrona",
  productPhotoPath: "images/products/ab-photo.jpg",
  imagePath: "images/products/ab-drawing.png",
  componentGroups: [{ id: "legs", label: "Gambe", options: [{ id: "black", label: "RAL 9005 Jet Black" }] }],
} as CatalogProduct;

const line: OfferLine = {
  id: "line-1", productCode: "AB 1000", quantity: 1, unitPrice: 1000,
  extras: [], discount: "10", manualSurcharge: 0, note: "Con feltrini",
  configuration: {
    fabric: "Camira ERA CSE30",
    "component:legs": "black",
    class1IM: true,
    fireRetardant: true,
  },
};

describe("PDF commercial content", () => {
  it("localizes offer metadata and includes commercial fields", () => {
    const offer = {
      ...createEmptyOffer("u1", "o1", "2026-07-20T00:00:00.000Z"),
      number: "OFF-1",
      paymentTerms: "Bonifico 30 giorni",
      offerNotes: "Trasporto escluso",
      project: { reference: "Hotel", contact: "Gaia" },
    };
    expect(metadataLines(offer)).toEqual(expect.arrayContaining([
      "N. Offerta: OFF-1", "Rif. progetto: Hotel", "Referente: Gaia",
      "Pagamento: Bonifico 30 giorni", "Note: Trasporto escluso",
    ]));
  });

  it("summarizes only the configuration actually selected", () => {
    const lines = configurationLines(line, product);
    expect(lines).toEqual(expect.arrayContaining([
      "Tessuto: Camira ERA CSE30",
      "Gambe: RAL 9005 Jet Black",
      "Classe 1IM",
      "Verniciatura ignifuga",
      "Note: Con feltrini",
    ]));
    expect(lines.join(" ")).not.toContain("Rivestimento sconsigliato dal listino ufficiale");
  });

  it("prefers a custom line image over the catalog photo and drawing", () => {
    expect(resolveLineImageUrl(line, product, { "line-1": "blob:custom" })).toBe("blob:custom");
    expect(resolveLineImageUrl(line, product, {})).toBe("/apps/true-generatore-offerte/images/products/ab-photo.jpg");
  });
});
