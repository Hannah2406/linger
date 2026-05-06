import Link from "next/link";
import type { Item, ItemCategory } from "@/lib/types";
import { daysUntil, fractionElapsed, formatMoney } from "@/lib/format";

const placeholderByCategory: Record<ItemCategory, string> = {
  clothes: "bg-accent-soft",
  beauty: "bg-lilac-soft",
  electronics: "bg-butter-soft",
  home: "bg-success-soft",
  other: "bg-warning-soft",
};

export default function ItemCard({
  item,
  highlight,
}: {
  item: Item;
  highlight?: boolean;
}) {
  const days = daysUntil(item.cooldown_ends_at);
  const progress = fractionElapsed(
    item.cooldown_started_at,
    item.cooldown_ends_at
  );
  const ended = days <= 0 || item.status === "pending_decision";

  const priceDropped =
    item.price_current !== null &&
    item.price_current < item.price_added * 0.95;
  const lowStock = item.is_in_stock === false;
  const placeholderTint = placeholderByCategory[item.category];

  return (
    <Link
      href={`/items/${item.id}`}
      className={`block bg-surface border rounded-3xl p-3 transition hover:shadow-sm ${
        highlight ? "border-accent" : "border-border"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-20 h-20 rounded-2xl ${placeholderTint} overflow-hidden flex-shrink-0`}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-xs">
              no photo
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium truncate">{item.name}</p>
            <p className="text-sm text-muted whitespace-nowrap">
              {formatMoney(Number(item.price_added), item.price_currency)}
            </p>
          </div>
          {item.store_name && (
            <p className="text-xs text-muted truncate">{item.store_name}</p>
          )}
          {item.reason && (
            <p className="text-xs text-muted italic truncate mt-0.5">
              &ldquo;{item.reason}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {priceDropped && (
              <span className="text-[11px] bg-accent-soft text-foreground px-2 py-0.5 rounded-full">
                ↓ on sale
              </span>
            )}
            {lowStock && (
              <span className="text-[11px] bg-warning-soft text-foreground px-2 py-0.5 rounded-full">
                selling out
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full ${ended ? "bg-accent" : "bg-success"}`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted whitespace-nowrap">
              {ended
                ? "decide now"
                : days === 1
                  ? "1 day left"
                  : `${days} days left`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
