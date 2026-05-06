"use client";

import { useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import EmptyArt from "@/components/shared/EmptyArt";

export default function ArchiveTabs({
  archived,
  bought,
}: {
  archived: Item[];
  bought: Item[];
}) {
  const [tab, setTab] = useState<"archived" | "bought">("archived");
  const items = tab === "archived" ? archived : bought;
  const total = items.reduce((s, i) => s + Number(i.price_added), 0);

  return (
    <div>
      <div className="px-5 pt-2">
        <div className="bg-surface border border-border rounded-full p-1 flex">
          <TabButton
            active={tab === "archived"}
            onClick={() => setTab("archived")}
            label="No thanks"
            count={archived.length}
          />
          <TabButton
            active={tab === "bought"}
            onClick={() => setTab("bought")}
            label="Bought"
            count={bought.length}
          />
        </div>
      </div>

      {items.length > 0 && (
        <p className="text-center text-sm text-muted mt-4">
          {tab === "archived" ? "Total kept: " : "Total spent: "}
          <span className="font-medium text-foreground">
            {formatMoney(total, "USD", { compact: true })}
          </span>
        </p>
      )}

      <div className="px-5 py-4 space-y-2">
        {items.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          items.map((item) => <ArchiveRow key={item.id} item={item} tab={tab} />)
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-full text-sm transition ${
        active ? "bg-accent text-accent-fg" : "text-muted"
      }`}
    >
      {label}
      <span className="ml-1.5 text-[11px] opacity-70">{count}</span>
    </button>
  );
}

function ArchiveRow({ item, tab }: { item: Item; tab: "archived" | "bought" }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="bg-surface border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-accent-soft transition"
    >
      <div className="w-12 h-12 rounded-xl bg-accent-soft overflow-hidden flex-shrink-0">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted truncate">
          {item.store_name ? `${item.store_name} · ` : ""}
          {item.decided_at &&
            new Date(item.decided_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
        </p>
      </div>
      <p
        className={`text-sm font-medium ${
          tab === "archived" ? "text-success" : "text-muted"
        }`}
      >
        {tab === "archived" ? "+" : ""}
        {formatMoney(Number(item.price_added), item.price_currency, {
          compact: true,
        })}
      </p>
    </Link>
  );
}

function EmptyTab({ tab }: { tab: "archived" | "bought" }) {
  return (
    <div className="bg-surface border border-border rounded-3xl px-6 py-10 text-center">
      <EmptyArt size={80} />
      <p className="text-muted text-sm mt-5">
        {tab === "archived"
          ? "Pass on something and it'll show up here."
          : "Things you've bought through Linger will live here."}
      </p>
    </div>
  );
}
