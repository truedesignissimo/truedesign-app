import type { Offer, OfferLine, OfferTotals } from "./types";

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateLineTotal(line: OfferLine): number {
  const extrasPerUnit = line.extras.reduce((total, extra) => total + extra, 0);
  const gross = (line.unitPrice + extrasPerUnit) * Math.max(0, line.quantity);
  const multiplier = 1 - clampPercent(line.discountPercent) / 100;
  return roundMoney(gross * multiplier);
}

export function calculateOfferTotals(offer: Offer): OfferTotals {
  const subtotal = roundMoney(
    offer.lines.reduce((total, line) => total + calculateLineTotal(line), 0),
  );
  const discount = roundMoney(subtotal * (clampPercent(offer.globalDiscountPercent) / 100));
  return { subtotal, discount, total: roundMoney(subtotal - discount) };
}
