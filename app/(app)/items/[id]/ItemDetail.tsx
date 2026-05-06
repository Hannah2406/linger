"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import type { Item } from "@/lib/types";
import {
  daysUntil,
  fractionElapsed,
  formatMoney,
} from "@/lib/format";

export default function ItemDetail({ item }: { item: Item }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const days = daysUntil(item.cooldown_ends_at);
  const progress = fractionElapsed(
    item.cooldown_started_at,
    item.cooldown_ends_at
  );

  const priceDropped =
    item.price_current !== null &&
    item.price_current < item.price_added * 0.95;
  const priceDelta =
    item.price_current !== null
      ? Number(item.price_added) - Number(item.price_current)
      : 0;

  async function handleOverride() {
    if (!item.source_url) return;
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "override" }),
    });
    window.open(item.source_url, "_blank");
    router.push("/home");
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm("Remove this from Linger? This can't be undone.")) return;
    setRemoving(true);
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    router.push("/home");
    router.refresh();
  }

  return (
    <>
      <PageHeader back="/home" />
      <div className="px-5 pb-8">
        {item.image_url && (
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-accent-soft mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="font-serif text-3xl mb-2">{item.name}</h1>
        <p className="text-muted">
          {formatMoney(Number(item.price_added), item.price_currency)}
          {item.store_name && ` · ${item.store_name}`}
          {` · ${item.category}`}
        </p>

        <div className="bg-surface border border-border rounded-3xl px-5 py-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">
              {days === 1 ? "1 day remaining" : `${days} days remaining`}
            </p>
            <p className="text-xs text-muted">
              {Math.round(progress * 100)}%
            </p>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-success"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {item.reason && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
              Your reason
            </p>
            <p className="italic text-foreground">&ldquo;{item.reason}&rdquo;</p>
          </div>
        )}

        {priceDropped && (
          <div className="mt-5 bg-accent-soft rounded-2xl px-4 py-3">
            <p className="text-sm">
              Now{" "}
              <span className="font-medium">
                {formatMoney(
                  Number(item.price_current),
                  item.price_currency
                )}
              </span>{" "}
              — down{" "}
              {formatMoney(priceDelta, item.price_currency)} since you added it.
            </p>
          </div>
        )}
        {item.is_in_stock === false && (
          <div className="mt-3 bg-warning-soft rounded-2xl px-4 py-3">
            <p className="text-sm">Selling out — last sizes / units.</p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {item.source_url && (
            <button
              onClick={() => setConfirming(true)}
              className="w-full bg-surface border border-border rounded-full py-3 text-sm text-muted hover:bg-accent-soft transition"
            >
              Override cooldown and buy now
            </button>
          )}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-full bg-surface border border-border rounded-full py-3 text-sm text-muted hover:bg-accent-soft transition"
          >
            Remove from Linger
          </button>
        </div>

        {confirming && (
          <div className="fixed inset-0 z-40 bg-black/30 flex items-end md:items-center justify-center p-4">
            <div className="bg-surface rounded-3xl p-6 max-w-sm w-full">
              <p className="font-serif text-xl mb-3">Sure you want to override?</p>
              <p className="text-sm text-muted mb-5">
                You added this {Math.max(1, Math.round(progress * (
                  (new Date(item.cooldown_ends_at).getTime() -
                    new Date(item.cooldown_started_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )))} days ago. Most people who wait the full time end up not wanting it.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleOverride}
                  className="w-full bg-foreground text-surface rounded-full py-3 text-sm"
                >
                  Take me to buy
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="w-full bg-accent text-accent-fg rounded-full py-3 text-sm font-medium"
                >
                  Wait it out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
