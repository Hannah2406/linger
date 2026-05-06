"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckIn() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/checkin")
      .then((r) => r.json())
      .then((data) => setShow(!!data.show))
      .catch(() => setShow(false));
  }, []);

  if (!show) return null;

  async function answer(value: "bored" | "shopping" | "dismissed") {
    setSubmitting(true);
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: value }),
    });
    if (value === "bored") {
      router.push("/bored");
      return;
    }
    setShow(false);
  }

  return (
    <div className="px-5 mt-2 mb-4">
      <div className="bg-accent-soft rounded-3xl px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-sm text-foreground">
            Hey. Are you bored, or actually shopping for something?
          </p>
          <button
            onClick={() => answer("dismissed")}
            disabled={submitting}
            aria-label="Dismiss"
            className="text-muted hover:text-foreground -mt-1"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2">
          <button
            disabled={submitting}
            onClick={() => answer("bored")}
            className="flex-1 bg-surface rounded-full py-2 text-sm hover:bg-white transition"
          >
            I&apos;m bored
          </button>
          <button
            disabled={submitting}
            onClick={() => answer("shopping")}
            className="flex-1 bg-surface rounded-full py-2 text-sm hover:bg-white transition"
          >
            I&apos;m shopping
          </button>
        </div>
      </div>
    </div>
  );
}
