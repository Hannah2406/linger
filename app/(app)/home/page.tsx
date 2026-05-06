import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { translateAmountCompound } from "@/lib/translations";
import { formatMoney } from "@/lib/format";
import ItemCard from "@/components/home/ItemCard";
import CheckIn from "@/components/home/CheckIn";
import SaveToast from "@/components/home/SaveToast";
import EmptyArt from "@/components/shared/EmptyArt";
import Onboarding from "@/components/onboarding/Onboarding";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [itemsResult, archivedResult, profileResult] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "pending_decision"])
      .order("cooldown_ends_at", { ascending: true }),
    supabase
      .from("items")
      .select("price_added, decided_at")
      .eq("user_id", user.id)
      .eq("status", "archived"),
    supabase
      .from("profiles")
      .select("display_name, bored_checkin_enabled, onboarding_completed_at")
      .eq("id", user.id)
      .single(),
  ]);

  const items = (itemsResult.data ?? []) as Item[];
  const archived = archivedResult.data ?? [];

  const total = archived.reduce((s, r) => s + Number(r.price_added), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthTotal = archived
    .filter(
      (r) =>
        r.decided_at && new Date(r.decided_at).getTime() >= monthStart.getTime()
    )
    .reduce((s, r) => s + Number(r.price_added), 0);

  const profile = profileResult.data;
  const pending = items.filter((i) => i.status === "pending_decision");
  const active = items.filter((i) => i.status === "active");

  if (!profile?.onboarding_completed_at) {
    return <Onboarding />;
  }

  return (
    <main className="flex-1">
      <Suspense fallback={null}>
        <SaveToast />
      </Suspense>
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <p className="font-serif text-2xl">
          Hi{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </p>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-accent-soft transition"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      <section className="px-5 mt-2">
        <div className="relative bg-soft-gradient rounded-[28px] px-6 py-10 text-center overflow-hidden border border-white/50 shadow-[0_4px_28px_rgba(42,26,46,0.05)]">
          <span className="orb w-44 h-44 -top-12 -left-10 bg-accent-soft" />
          <span className="orb w-36 h-36 -bottom-12 -right-8 bg-lilac-soft" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.25em] text-muted mb-2">
              Money kept
            </p>
            <p className="font-serif text-6xl text-foreground leading-none">
              {formatMoney(total, "USD", { compact: true })}
            </p>
            {total > 20 && (
              <p className="text-sm text-muted mt-3">
                ≈ {translateAmountCompound(total)}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted">
              <div>
                <span className="text-foreground font-medium">
                  {formatMoney(monthTotal, "USD", { compact: true })}
                </span>{" "}
                this month
              </div>
              <div>
                <span className="text-foreground font-medium">
                  {archived.length}
                </span>{" "}
                items kept
              </div>
            </div>
          </div>
        </div>
      </section>

      {profile?.bored_checkin_enabled && <CheckIn />}

      {pending.length > 0 && (
        <Section title="Time's up">
          <div className="space-y-3">
            {pending.map((item) => (
              <ItemCard key={item.id} item={item} highlight />
            ))}
          </div>
        </Section>
      )}

      <Section title={`On cooldown${active.length ? ` (${active.length})` : ""}`}>
        {active.length === 0 ? (
          <EmptyHome />
        ) : (
          <div className="space-y-3">
            {active.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-4">
      <h2 className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyHome() {
  return (
    <div className="bg-surface border border-border rounded-3xl px-6 py-10 text-center">
      <EmptyArt size={96} />
      <p className="text-foreground font-serif text-xl mt-5 mb-2">
        Nothing on cooldown yet.
      </p>
      <p className="text-sm text-muted mb-5">
        Add something you&apos;re tempted by.
      </p>
      <Link
        href="/add"
        className="inline-block bg-accent text-accent-fg px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
      >
        Add your first thing
      </Link>
    </div>
  );
}
