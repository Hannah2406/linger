import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { translateAmountCompound } from "@/lib/translations";
import EmptyArt from "@/components/shared/EmptyArt";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BoredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "archived")
    .order("decided_at", { ascending: false })
    .limit(50);

  const items = (data ?? []) as Item[];
  const total = items.reduce((s, i) => s + Number(i.price_added), 0);

  return (
    <main className="flex-1">
      <div className="relative bg-soft-gradient overflow-hidden">
        <span className="orb w-72 h-72 -top-24 -left-12 bg-accent-soft" />
        <span className="orb w-64 h-64 top-10 -right-16 bg-lilac-soft" />

        <div className="relative px-6 pt-12 pb-8 text-center">
          <Link
            href="/home"
            className="absolute left-4 top-4 text-sm text-muted hover:text-foreground transition"
            aria-label="Back home"
          >
            ← back
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-muted mb-3">
            Window-shopping mode
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-snug mb-3">
            Look at all the things
            <br />
            you didn&apos;t buy.
          </h1>
          {total > 0 ? (
            <p className="text-sm text-muted">
              {formatMoney(total, "USD", { compact: true })} kept ·{" "}
              {items.length} item{items.length === 1 ? "" : "s"}
              {total > 50 && (
                <>
                  <br />≈ {translateAmountCompound(total)}
                </>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Pass on something and it&apos;ll show up here.
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-6">
        {items.length === 0 ? (
          <div className="bg-surface border border-border rounded-3xl px-6 py-10 text-center">
            <EmptyArt size={88} />
            <p className="text-muted text-sm mt-5">
              Your future-archive is empty. That&apos;s fine.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <BoredCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BoredCard({ item }: { item: Item }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="aspect-square bg-accent-soft overflow-hidden">
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
      <div className="p-3">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-success font-medium mt-0.5">
          +{formatMoney(Number(item.price_added), item.price_currency, {
            compact: true,
          })}{" "}
          kept
        </p>
      </div>
    </div>
  );
}
