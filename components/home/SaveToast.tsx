"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SaveToast() {
  const router = useRouter();
  const params = useSearchParams();
  const added = params.get("added");
  const dup = params.get("dup");
  const days = params.get("d");

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!added) return;
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), 4000);
    const clearTimer = setTimeout(() => {
      router.replace("/home", { scroll: false });
    }, 4400);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [added, router]);

  if (!added) return null;

  const message = dup
    ? "You already had this on cooldown."
    : days
      ? `Cooldown started. We'll remind you in ${days} day${days === "1" ? "" : "s"}.`
      : "Cooldown started. We'll let you know.";

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible
          ? "opacity-100 top-6"
          : "opacity-0 top-2 pointer-events-none"
      }`}
    >
      <div className="bg-foreground text-surface text-sm rounded-full px-5 py-2.5 shadow-[0_8px_28px_rgba(42,26,46,0.25)] flex items-center gap-2">
        <span>✨</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
