"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import type { Item } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { translateAmountCompound } from "@/lib/translations";

type Stage = "ask" | "celebrate";

export default function DecisionMoment({ item }: { item: Item }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("ask");
  const [busy, setBusy] = useState(false);
  const [savedAmount, setSavedAmount] = useState<number>(
    Number(item.price_added)
  );
  const [totalKept, setTotalKept] = useState<number>(0);
  const [monthKept, setMonthKept] = useState<number>(0);

  async function handleYes() {
    setBusy(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decide_yes" }),
    });
    if (item.source_url) {
      window.open(item.source_url, "_blank");
    }
    router.push("/home");
    router.refresh();
  }

  async function handleNo() {
    setBusy(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decide_no" }),
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.4 },
      colors: ["#d98aa6", "#7a9b6e", "#f5dde6"],
    });

    try {
      const res = await fetch("/api/stats");
      const stats = await res.json();
      setTotalKept(stats.total_kept ?? 0);
      setMonthKept(stats.month_kept ?? 0);
    } catch {
      setTotalKept(savedAmount);
    }

    setSavedAmount(Number(item.price_added));
    setStage("celebrate");
    setBusy(false);
  }

  async function handleExtend() {
    setBusy(true);
    const originalDays = Math.max(
      1,
      Math.round(
        (new Date(item.cooldown_ends_at).getTime() -
          new Date(item.cooldown_started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend", extend_days: originalDays }),
    });
    router.push("/home");
    router.refresh();
  }

  async function handleShare() {
    const text = `+${formatMoney(savedAmount, "USD", { compact: true })} kept ✨ Linger`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: window.location.origin });
      } catch {
        // user dismissed
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  if (stage === "celebrate") {
    return (
      <main className="fixed inset-0 z-50 bg-soft-gradient flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <span className="orb w-72 h-72 -top-16 -left-12 bg-accent-soft" />
        <span className="orb w-80 h-80 -bottom-20 -right-16 bg-success-soft" />
        <span className="orb w-56 h-56 top-1/3 right-10 bg-lilac-soft" />

        <p className="relative font-serif text-7xl text-success mb-3">
          +{formatMoney(savedAmount, "USD", { compact: true })}
        </p>
        <p className="relative text-2xl text-foreground mb-1">kept ✨</p>

        <div className="relative mt-10 space-y-1">
          <p className="text-sm text-muted">
            This month:{" "}
            <span className="text-foreground font-medium">
              {formatMoney(monthKept, "USD", { compact: true })}
            </span>
          </p>
          <p className="text-sm text-muted">
            Lifetime:{" "}
            <span className="text-foreground font-medium">
              {formatMoney(totalKept, "USD", { compact: true })}
            </span>
          </p>
          {totalKept > 50 && (
            <p className="text-sm text-muted mt-3">
              ≈ {translateAmountCompound(totalKept)}
            </p>
          )}
        </div>

        <div className="relative mt-12 space-y-3 w-full max-w-xs">
          <button
            onClick={handleShare}
            className="w-full bg-accent text-accent-fg rounded-full py-3 font-medium hover:opacity-90 transition shadow-[0_8px_24px_rgba(217,138,166,0.3)]"
          >
            Share this win
          </button>
          <button
            onClick={() => {
              router.push("/home");
              router.refresh();
            }}
            className="w-full bg-surface/80 backdrop-blur border border-border rounded-full py-3"
          >
            Done
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 bg-background flex flex-col px-6 py-10 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        {item.image_url && (
          <div className="w-full max-w-xs aspect-[4/5] rounded-3xl overflow-hidden bg-accent-soft mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
          Time&apos;s up
        </p>
        <h1 className="font-serif text-4xl mb-3">Still want this?</h1>
        <p className="text-lg text-foreground">
          {item.name} ·{" "}
          {formatMoney(Number(item.price_added), item.price_currency)}
        </p>

        {item.reason && (
          <div className="mt-6 bg-surface border border-border rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
              Your reason
            </p>
            <p className="italic">&ldquo;{item.reason}&rdquo;</p>
          </div>
        )}

        <div className="mt-10 w-full space-y-3">
          {item.source_url && (
            <button
              disabled={busy}
              onClick={handleYes}
              className="w-full bg-foreground text-surface rounded-full py-3.5"
            >
              Yes — take me to buy
            </button>
          )}
          {!item.source_url && (
            <button
              disabled={busy}
              onClick={handleYes}
              className="w-full bg-foreground text-surface rounded-full py-3.5"
            >
              Yes, I bought it
            </button>
          )}
          <button
            disabled={busy}
            onClick={handleNo}
            className="w-full bg-accent text-accent-fg rounded-full py-3.5 font-medium"
          >
            No thanks — archive it
          </button>
          <button
            disabled={busy}
            onClick={handleExtend}
            className="w-full bg-surface border border-border rounded-full py-3 text-sm text-muted"
          >
            Wait longer
          </button>
        </div>
      </div>
    </main>
  );
}
