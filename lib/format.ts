// Money + date helpers used across the app.

export function formatMoney(
  amount: number,
  currency = "USD",
  opts: { compact?: boolean } = {}
): string {
  const fractionDigits = Number.isInteger(amount) || opts.compact ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function fractionElapsed(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

export function isCooldownEnded(endIso: string): boolean {
  return new Date(endIso).getTime() <= Date.now();
}
