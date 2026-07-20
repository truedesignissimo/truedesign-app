export function parseDiscountExpression(value: string): number[] {
  return String(value ?? "")
    .split("+")
    .map((part) => Number(part.trim().replace(",", ".")))
    .filter(Number.isFinite)
    .map((part) => Math.min(100, Math.max(0, part)));
}

export function discountMultiplier(value: string): number {
  return parseDiscountExpression(value)
    .reduce((factor, discount) => factor * (1 - discount / 100), 1);
}

export function discountLabel(value: string): string {
  return parseDiscountExpression(value).join("+") || "0";
}
