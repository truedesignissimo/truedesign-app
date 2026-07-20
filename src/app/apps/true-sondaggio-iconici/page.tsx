import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Survey, { type Product } from "./survey";

export const metadata: Metadata = {
  title: "Sondaggio Prodotti Iconici",
  description: "Scegli le cinque collezioni che rappresentano meglio l'identità di True.",
};

export const dynamic = "force-static";

function loadProducts(): Product[] {
  const legacyApp = fs.readFileSync(
    path.join(process.cwd(), "true-sondaggio-iconici", "index.html"),
    "utf8",
  );
  const match = legacyApp.match(/const PRODUCTS = (\[[\s\S]*?\]);\s*const MAX/);

  if (!match) {
    throw new Error("Elenco prodotti non trovato nel progetto originale del sondaggio.");
  }

  return JSON.parse(match[1]) as Product[];
}

export default function TrueSondaggioIconiciPage() {
  return <Survey products={loadProducts()} />;
}
