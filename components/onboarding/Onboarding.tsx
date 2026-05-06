"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const cards = [
  {
    eyebrow: "Welcome",
    title: "Linger helps you wait\nbefore buying things.",
    body: "It's a small, soft cooldown for the things you want.",
  },
  {
    eyebrow: "How it works",
    title: "Paste a link or\nsnap a photo.",
    body: "We'll hide it for a week, then ask if you still want it.",
  },
  {
    eyebrow: "The point",
    title: "Most of the time,\nyou won't.",
    body: "Every “no thanks” adds to your savings counter.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  async function finish(goToAdd: boolean) {
    setClosing(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completed: true }),
    });
    if (goToAdd) router.push("/add");
    router.refresh();
  }

  const isLast = step === cards.length - 1;
  const card = cards[step];

  return (
    <main className="fixed inset-0 z-50 bg-soft-gradient flex flex-col px-6 py-10 overflow-hidden">
      <span className="orb w-72 h-72 -top-20 -left-12 bg-accent-soft" />
      <span className="orb w-80 h-80 top-1/3 -right-24 bg-lilac-soft" />
      <span className="orb w-64 h-64 -bottom-20 left-12 bg-success-soft" />

      <div className="relative flex justify-end">
        <button
          onClick={() => finish(false)}
          disabled={closing}
          className="text-sm text-muted px-3 py-1 hover:text-foreground transition"
        >
          Skip
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.3em] text-muted mb-5">
          {card.eyebrow}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] text-foreground mb-5 whitespace-pre-line">
          {card.title}
        </h1>
        <p className="text-base text-muted leading-relaxed">{card.body}</p>
      </div>

      <div className="relative flex flex-col items-center gap-4 pb-2">
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-foreground" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? finish(true) : setStep((s) => s + 1))}
          disabled={closing}
          className="w-full max-w-xs bg-accent text-accent-fg rounded-full py-3.5 font-medium hover:opacity-90 transition shadow-[0_8px_24px_rgba(217,138,166,0.3)]"
        >
          {isLast ? "Add my first thing" : "Next"}
        </button>
      </div>
    </main>
  );
}
