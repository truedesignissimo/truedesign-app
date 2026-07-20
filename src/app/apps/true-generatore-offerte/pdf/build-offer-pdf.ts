import { jsPDF } from "jspdf";
import logo from "../assets/true-logo.png";
import type { CatalogProduct } from "../data/catalog";
import { calculateLineTotal, calculateOfferTotals } from "../domain/pricing";
import type { Offer, OfferLine } from "../domain/types";

const APP_ASSET_BASE = "/apps/true-generatore-offerte/";
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const text = (value: unknown) => String(value ?? "").trim();

const labels = {
  it: { offer: "Offerta Commerciale", number: "N. Offerta", date: "Data", validity: "Validità fino al", project: "Rif. progetto", contact: "Referente", customer: "Cliente", payment: "Pagamento", notes: "Note", name: "Nome", qty: "Qta", category: "Cat", price: "Prezzo", discount: "Sconto", extra: "Extra", total: "Totale", subtotal: "Subtotale", global: "Sconto generale", vat: "IVA" },
  en: { offer: "Commercial Quote", number: "Quote No.", date: "Date", validity: "Valid Until", project: "Project ref.", contact: "Contact", customer: "Client", payment: "Payment", notes: "Notes", name: "Name", qty: "Qty", category: "Cat.", price: "Price", discount: "Discount", extra: "Extra", total: "Total", subtotal: "Subtotal", global: "Overall discount", vat: "VAT" },
  fr: { offer: "Devis Commercial", number: "N° Devis", date: "Date", validity: "Valable jusqu'au", project: "Réf. projet", contact: "Contact", customer: "Client", payment: "Paiement", notes: "Notes", name: "Nom", qty: "Qté", category: "Cat.", price: "Prix", discount: "Remise", extra: "Extra", total: "Total", subtotal: "Sous-total", global: "Remise générale", vat: "TVA" },
  de: { offer: "Kommerzielles Angebot", number: "Angebot Nr.", date: "Datum", validity: "Gültig bis", project: "Projektref.", contact: "Kontakt", customer: "Kunde", payment: "Zahlung", notes: "Notizen", name: "Name", qty: "Menge", category: "Kat.", price: "Preis", discount: "Rabatt", extra: "Extra", total: "Summe", subtotal: "Zwischensumme", global: "Gesamtrabatt", vat: "MwSt." },
} as const;

const languageLabels = (offer: Offer) => labels[offer.language as keyof typeof labels] ?? labels.en;

export function fitImage(sourceWidth: number, sourceHeight: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}

async function imageData(url: string): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Immagine non elaborabile"));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      resolve({ data: canvas.toDataURL("image/jpeg", .86), width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error("Immagine non caricabile"));
    image.src = url;
  });
}

const localizedDate = (value: string, language: Offer["language"]): string => {
  if (!value) return "-";
  const locale = language === "it" ? "it-IT" : language === "fr" ? "fr-FR" : language === "de" ? "de-DE" : "en-GB";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(locale);
};

export function metadataLines(offer: Offer): string[] {
  const t = languageLabels(offer);
  return [
    `${t.number}: ${offer.number || "-"}`,
    `${t.date}: ${localizedDate(offer.offerDate, offer.language)}`,
    `${t.validity}: ${localizedDate(offer.validUntil, offer.language)}`,
    offer.project.reference ? `${t.project}: ${offer.project.reference}` : "",
    (offer.project.contact || offer.salesRepresentative) ? `${t.contact}: ${offer.project.contact || offer.salesRepresentative}` : "",
    offer.paymentTerms ? `${t.payment}: ${offer.paymentTerms}` : "",
    offer.offerNotes ? `${t.notes}: ${offer.offerNotes}` : "",
  ].filter(Boolean);
}

export function configurationLines(line: OfferLine, product: CatalogProduct): string[] {
  const groups = (product.componentGroups as Array<{ id: string; label: string; options?: Array<{ id: string; label: string }> }> | undefined) ?? [];
  const values = line.configuration;
  const result: string[] = [];
  if (values.fabric) result.push(`Tessuto: ${values.fabric}`);
  for (const group of groups) {
    const selected = text(values[`component:${group.id}`]);
    const option = group.options?.find((item) => item.id === selected);
    if (option) result.push(`${group.label}: ${option.label}`);
  }
  if (values.class1IM) result.push("Classe 1IM");
  if (values.fireRetardant) result.push("Verniciatura ignifuga");
  if (line.manualSurcharge > 0) result.push(`Maggiorazione: ${euro.format(line.manualSurcharge)}`);
  if (line.note) result.push(`Note: ${line.note}`);
  return result;
}

export function resolveLineImageUrl(line: OfferLine, product: CatalogProduct, imageUrls: Record<string, string>): string {
  if (imageUrls[line.id]) return imageUrls[line.id];
  const path = product.productPhotoPath || product.imagePath;
  return path ? `${APP_ASSET_BASE}${path}` : "";
}

const selectedExtra = (line: OfferLine, product: CatalogProduct) => {
  const selectedId = text(line.configuration.extraId);
  const extras = (product.extraCharges as Array<{ id: string; label: string }> | undefined) ?? [];
  return extras.find((extra) => extra.id === selectedId);
};

const fitTextLines = (doc: jsPDF, value: string, maxWidth: number, maxLines: number): string[] => {
  const lines = doc.splitTextToSize(value, maxWidth) as string[];
  if (lines.length <= maxLines) return lines;
  const fitted = lines.slice(0, maxLines);
  let last = fitted[maxLines - 1]?.trim() ?? "";
  while (last && doc.getTextWidth(`${last}...`) > maxWidth) last = last.slice(0, -1).trimEnd();
  fitted[maxLines - 1] = `${last.replace(/[.,;:|-]+$/, "")}...`;
  return fitted;
};

export async function buildOfferPdf(offer: Offer, products: CatalogProduct[], imageUrls: Record<string, string> = {}): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const t = languageLabels(offer);
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const right = pageWidth - margin;
  const logoImage = await imageData(logo.src).catch(() => null);
  const preparedImages = await Promise.all(offer.lines.map(async (line) => {
    const product = products.find((item) => item.code === line.productCode);
    if (!product) return null;
    const url = resolveLineImageUrl(line, product, imageUrls);
    return url ? imageData(url).catch(() => null) : null;
  }));

  let y = 18;
  const footer = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(115);
    doc.text("TRUE DESIGN S.r.l. a socio unico - Via L. da Vinci 2, 35040 Sant'Elena (PD) - T +39 0429 692483", margin, 287);
    doc.setTextColor(24);
  };
  const header = () => {
    y = 18;
    if (logoImage) {
      const size = fitImage(logoImage.width, logoImage.height, 24, 8);
      doc.addImage(logoImage.data, "JPEG", margin, y, size.width, size.height, undefined, "FAST");
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("true", margin, y + 7);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(t.offer, margin, y + 14);

    const rightMeta = metadataLines(offer).slice(0, 5);
    doc.setFontSize(8.5);
    let metaY = y + 1;
    for (const line of rightMeta) {
      const wrapped = doc.splitTextToSize(line, 66) as string[];
      wrapped.forEach((part) => { doc.text(part, 128, metaY); metaY += 4.2; });
    }
    y = Math.max(40, metaY + 2);
    doc.setDrawColor(30);
    doc.line(margin, y, right, y);
    y += 8;
  };
  const newPage = () => { footer(); doc.addPage(); header(); };

  header();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t.customer, margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  const customerLines = [
    offer.customer.name,
    offer.customer.company,
    offer.customer.vatNumber ? `Partita IVA / Tax ID: ${offer.customer.vatNumber}` : "",
    offer.customer.email,
    offer.customer.phone,
    offer.customer.address,
  ].filter(Boolean) as string[];
  for (const line of customerLines) { doc.text(line, margin, y); y += 4.5; }

  const longMeta = metadataLines(offer).slice(5);
  if (longMeta.length) {
    y += 2;
    doc.setFontSize(8);
    for (const line of longMeta) {
      const wrapped = doc.splitTextToSize(line, 162) as string[];
      doc.text(wrapped, margin, y);
      y += Math.max(4.5, wrapped.length * 4);
    }
  }
  y += 6;

  const showPrices = offer.showNetPrices;
  const showDiscounts = showPrices && offer.showDiscounts;
  const imageX = margin;
  const nameX = 49;
  const qtyX = showPrices ? 111 : 163;
  const categoryX = showPrices ? 122 : 178;
  const priceRight = 149;
  const discountRight = 164;
  const extraRight = 180;
  const totalRight = right;
  const detailWidth = qtyX - nameX - 4;

  const drawTableHeader = () => {
    doc.setFillColor(245, 242, 236);
    doc.rect(margin, y, right - margin, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.7);
    doc.setTextColor(85);
    doc.text(t.name.toUpperCase(), nameX, y + 4.7);
    doc.text(t.qty.toUpperCase(), qtyX, y + 4.7);
    doc.text(t.category.toUpperCase(), categoryX, y + 4.7);
    if (showPrices) {
      doc.text(t.price.toUpperCase(), priceRight, y + 4.7, { align: "right" });
      if (showDiscounts) doc.text(t.discount.toUpperCase(), discountRight, y + 4.7, { align: "right" });
      doc.text(t.extra.toUpperCase(), extraRight, y + 4.7, { align: "right" });
      doc.text(t.total.toUpperCase(), totalRight, y + 4.7, { align: "right" });
    }
    doc.setTextColor(24);
    y += 10;
  };

  drawTableHeader();
  for (const [index, line] of offer.lines.entries()) {
    const product = products.find((item) => item.code === line.productCode);
    if (!product) continue;
    const config = configurationLines(line, product).join(" | ");
    const extra = selectedExtra(line, product);
    const rowHeight = Math.max(24, config || extra ? 28 : 22);
    if (y + rowHeight > pageHeight - 24) { newPage(); drawTableHeader(); }
    const mid = y + rowHeight / 2;
    const loaded = preparedImages[index];
    if (loaded) {
      const size = fitImage(loaded.width, loaded.height, 28, 18);
      doc.addImage(loaded.data, "JPEG", imageX + (28 - size.width) / 2, mid - size.height / 2, size.width, size.height, undefined, "FAST");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.text(line.productCode, nameX, mid - 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(55);
    doc.text(fitTextLines(doc, text(product.name_it || product.name), detailWidth, 1), nameX, mid - 1.5);
    if (config) {
      doc.setFontSize(5.8);
      doc.setTextColor(105);
      doc.text(fitTextLines(doc, config, detailWidth, 2), nameX, mid + 2.3);
    }
    if (extra) {
      doc.setFontSize(5.8);
      doc.setTextColor(125);
      const waived = line.configuration.waiveExtraCharge ? " (omaggio commerciale)" : "";
      doc.text(fitTextLines(doc, `Extra: ${extra.label}${waived}`, detailWidth, 1), nameX, mid + 7.2);
    }
    doc.setTextColor(24);
    doc.setFontSize(8);
    doc.text(String(line.quantity), qtyX, mid, { baseline: "middle" });
    doc.text(text(line.configuration.category) || "-", categoryX, mid, { baseline: "middle" });
    if (showPrices) {
      doc.text(euro.format(line.unitPrice), priceRight, mid, { align: "right", baseline: "middle" });
      if (showDiscounts) doc.text(line.discount || "-", discountRight, mid, { align: "right", baseline: "middle" });
      doc.text(line.extras.length ? euro.format(line.extras.reduce((sum, value) => sum + value, 0)) : "-", extraRight, mid, { align: "right", baseline: "middle" });
      doc.setFont("helvetica", "bold");
      doc.text(euro.format(calculateLineTotal(line)), totalRight, mid, { align: "right", baseline: "middle" });
    }
    y += rowHeight;
    doc.setDrawColor(224, 221, 213);
    doc.line(margin, y, right, y);
  }

  const totals = calculateOfferTotals(offer);
  if (y + 42 > pageHeight - 20) newPage();
  y += 5;
  doc.setDrawColor(30);
  doc.line(120, y, right, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const totalsRows: Array<[string, number]> = [[t.subtotal, totals.subtotal]];
  if (offer.showDiscounts && totals.discount) totalsRows.push([`${t.global} (${offer.globalDiscount || "0"}%)`, -totals.discount]);
  totalsRows.push([`${t.vat} (${offer.vatRate}%)`, totals.vat]);
  for (const [label, value] of totalsRows) {
    doc.text(label, 120, y);
    doc.text(euro.format(value), right, y, { align: "right" });
    y += 6;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(t.total.toUpperCase(), 120, y);
  doc.text(euro.format(totals.total), right, y, { align: "right" });
  footer();
  return doc;
}
