import { discountMultiplier } from "./discount";
import type { Offer, OfferLine, OfferTotals } from "./types";

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateLineTotal(line: OfferLine): number {
  const extrasPerUnit = line.extras.reduce((total, extra) => total + extra, 0);
  const gross = (line.unitPrice + extrasPerUnit + (line.manualSurcharge ?? 0))
    * Math.max(0, line.quantity);
  const discount = line.discount ?? String(line.discountPercent ?? 0);
  return roundMoney(gross * discountMultiplier(discount));
}

export function calculateOfferTotals(offer: Offer): OfferTotals {
  const subtotal = roundMoney(
    offer.lines.reduce((total, line) => total + calculateLineTotal(line), 0),
  );
  const globalDiscount = offer.globalDiscount ?? String(offer.globalDiscountPercent ?? 0);
  const net = roundMoney(subtotal * discountMultiplier(globalDiscount));
  const discount = roundMoney(subtotal - net);
  const vat = roundMoney(net * Math.max(0, offer.vatRate ?? 0) / 100);
  return { subtotal, discount, net, vat, total: roundMoney(net + vat) };
}
