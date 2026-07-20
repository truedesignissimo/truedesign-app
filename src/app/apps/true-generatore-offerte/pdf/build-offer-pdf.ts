import { jsPDF } from "jspdf";
import type { CatalogProduct } from "../data/catalog";
import { calculateLineTotal, calculateOfferTotals } from "../domain/pricing";
import type { Offer } from "../domain/types";

export function fitImage(sourceWidth: number, sourceHeight: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}

async function imageData(url: string): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = "anonymous";
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext("2d")?.drawImage(image, 0, 0); resolve({ data: canvas.toDataURL("image/jpeg", .9), width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => reject(new Error("Immagine non caricabile")); image.src = url;
  });
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const details = (configuration: Record<string, string | number | boolean | null>) => Object.entries(configuration)
  .filter(([key, value]) => value && key !== "priceChoice" && !key.startsWith("extra:"))
  .map(([, value]) => String(value)).slice(0, 5).join(" · ");

export async function buildOfferPdf(offer: Offer, products: CatalogProduct[], imageUrls: Record<string, string> = {}): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210; const pageHeight = 297; const margin = 16; const contentWidth = pageWidth - margin * 2;
  const header = () => {
    doc.setTextColor(24); doc.setFont("helvetica", "bold"); doc.setFontSize(38); doc.text("true", margin, 26);
    doc.setFontSize(10); doc.text("Offerta commerciale", margin, 34);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    const meta = [`N. offerta: ${offer.number}`, `Cliente: ${offer.customer.name || "—"}`, `Progetto: ${offer.project.reference || "—"}`, `Validità: ${offer.project.validUntil || "—"}`];
    meta.forEach((line, index) => doc.text(line, 125, 18 + index * 5, { maxWidth: 69 }));
    doc.setDrawColor(45); doc.line(margin, 42, pageWidth - margin, 42);
  };
  header(); let y = 51;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("PRODOTTO", margin + 39, y); doc.text("Q.TÀ", 157, y); doc.text("TOTALE", 174, y); y += 5;
  for (const line of offer.lines) {
    const product = products.find((item) => item.code === line.productCode); if (!product) continue;
    const description = details(line.configuration); const descriptionLines = doc.splitTextToSize(`${product.family} · ${String(product.name_it ?? product.name ?? "")}${description ? `\n${description}` : ""}`, 91);
    const rowHeight = Math.max(31, 13 + descriptionLines.length * 4);
    if (y + rowHeight > pageHeight - 24) { doc.addPage(); header(); y = 51; }
    const url = imageUrls[line.id] || (product.productPhotoPath ? `/apps/true-generatore-offerte/${product.productPhotoPath}` : product.imagePath ? `/apps/true-generatore-offerte/${product.imagePath}` : "");
    if (url) try { const loaded = await imageData(url); const size = fitImage(loaded.width, loaded.height, 33, rowHeight - 5); doc.addImage(loaded.data, "JPEG", margin + (33 - size.width) / 2, y + 2, size.width, size.height); } catch { /* layout remains valid without image */ }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(line.productCode, margin + 39, y + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(75); doc.text(descriptionLines, margin + 39, y + 12, { maxWidth: 91 });
    doc.setTextColor(24); doc.setFontSize(9); doc.text(String(line.quantity), 160, y + 8, { align: "center" }); doc.text(euro.format(calculateLineTotal(line)), pageWidth - margin, y + 8, { align: "right" });
    doc.setDrawColor(220); doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight); y += rowHeight;
  }
  const totals = calculateOfferTotals(offer); if (y > pageHeight - 48) { doc.addPage(); y = 24; }
  doc.setFontSize(8); doc.text("Subtotale", 143, y + 10); doc.text(euro.format(totals.subtotal), pageWidth - margin, y + 10, { align: "right" });
  doc.text("Sconto", 143, y + 16); doc.text(euro.format(totals.discount), pageWidth - margin, y + 16, { align: "right" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Totale", 143, y + 25); doc.text(euro.format(totals.total), pageWidth - margin, y + 25, { align: "right" });
  return doc;
}
