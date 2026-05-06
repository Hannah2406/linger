// Translates a saved-money amount into a real-life equivalent.
// Curated, intentionally aspirational-but-grounded for the target user.
// All amounts in USD.

type Equivalent = {
  label: string;
  unit: number;          // dollars per "unit"
  countable?: boolean;   // if true, can show "2× X"
};

const equivalents: Equivalent[] = [
  { label: "a flight home", unit: 350 },
  { label: "a month of groceries", unit: 280, countable: true },
  { label: "a month of rent (room share)", unit: 900 },
  { label: "a really good dinner out", unit: 80, countable: true },
  { label: "a year of Spotify", unit: 120 },
  { label: "a pair of nice jeans", unit: 110, countable: true },
  { label: "a weekend trip", unit: 450 },
  { label: "a coffee a day for a month", unit: 150 },
  { label: "a yoga class pack", unit: 180 },
  { label: "a textbook", unit: 90, countable: true },
];

export function translateAmount(amount: number): string {
  if (amount < 20) return "a few coffees";
  if (amount < 50) return "a takeaway dinner";

  // Try to find one that fits cleanly — within 1-3× of an equivalent.
  const ranked = equivalents
    .map((eq) => ({ eq, ratio: amount / eq.unit }))
    .filter(({ ratio }) => ratio >= 0.7);

  if (ranked.length === 0) return "a few small things";

  // Prefer the largest single equivalent (more impressive framing).
  const best = ranked.sort((a, b) => b.eq.unit - a.eq.unit)[0];
  const count = Math.floor(best.ratio);

  if (best.eq.countable && count >= 2 && count <= 12) {
    return `${count}× ${best.eq.label}`;
  }
  return best.eq.label;
}

// Pick TWO equivalents that together approximate the amount, for the home counter.
// E.g. "a flight home + 2 months of groceries"
export function translateAmountCompound(amount: number): string {
  if (amount < 20) return "a few coffees";
  if (amount < 80) return translateAmount(amount);

  const sorted = [...equivalents].sort((a, b) => b.unit - a.unit);
  for (const big of sorted) {
    if (big.unit > amount) continue;
    const remainder = amount - big.unit;
    if (remainder < 50) return big.label;
    for (const small of sorted) {
      if (small.unit > remainder) continue;
      const count = Math.floor(remainder / small.unit);
      if (count >= 1 && count <= 6) {
        return `${big.label} + ${
          count > 1 && small.countable ? `${count}× ` : ""
        }${small.label}`;
      }
    }
    return big.label;
  }
  return translateAmount(amount);
}
