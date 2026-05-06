"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import ItemForm, { type ItemFormValues } from "@/components/add/ItemForm";
import type { ExtractedItem, SourceType } from "@/lib/types";

type Step = "choose" | "url-paste" | "form";

export default function AddFlow({
  defaultOnline,
  defaultInperson,
}: {
  defaultOnline: number;
  defaultInperson: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [draft, setDraft] = useState<Partial<ItemFormValues>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDays =
    sourceType === "url" ? defaultOnline : defaultInperson;

  async function handleSave(values: ItemFormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          source_url: values.source_url || null,
          name: values.name,
          image_url: values.image_url || null,
          store_name: values.store_name || null,
          category: values.category,
          price_added: values.price_added,
          price_currency: values.price_currency || "USD",
          reason: values.reason || null,
          cooldown_days: values.cooldown_days,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      const params = new URLSearchParams({ added: data.item.id });
      if (data.duplicate) params.set("dup", "1");
      else params.set("d", String(values.cooldown_days));
      router.push(`/home?${params.toString()}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "choose") {
    return (
      <>
        <PageHeader title="Add" />
        <div className="px-5 py-4 space-y-3">
          <button
            onClick={() => {
              setSourceType("url");
              setStep("url-paste");
            }}
            className="w-full bg-surface border border-border rounded-3xl p-6 text-left hover:bg-accent-soft transition flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center">
              <LinkIcon />
            </div>
            <div>
              <p className="font-serif text-xl">Paste a link</p>
              <p className="text-sm text-muted">Something you saw online</p>
            </div>
          </button>

          <PhotoButton
            onPicked={(file) => {
              setSourceType("photo");
              setDraft({ photoFile: file });
              setStep("form");
            }}
          />
        </div>
      </>
    );
  }

  if (step === "url-paste") {
    return (
      <>
        <PageHeader title="Paste a link" back="/add" />
        <UrlPaste
          onExtracted={(url, extracted) => {
            setDraft({
              source_url: url,
              name: extracted.name ?? "",
              image_url: extracted.image_url ?? "",
              price_added: extracted.price ?? undefined,
              store_name: extracted.store_name ?? "",
              price_currency: extracted.currency || "USD",
            });
            setStep("form");
          }}
          onSkip={() => setStep("form")}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Save to Linger" back="/add" />
      <div className="px-5 py-4">
        <ItemForm
          initial={draft}
          defaultCooldownDays={defaultDays}
          submitting={submitting}
          onSubmit={handleSave}
          showUrlField={sourceType === "url"}
          requirePhoto={sourceType === "photo"}
        />
        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2 mt-3">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

function UrlPaste({
  onExtracted,
  onSkip,
}: {
  onExtracted: (url: string, e: ExtractedItem) => void;
  onSkip: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setError(null);
    if (!url.trim()) {
      onSkip();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/items/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as ExtractedItem;
      onExtracted(url.trim(), data);
    } catch {
      // Even on failure, proceed to form so user can fill manually.
      onExtracted(url.trim(), {
        success: false,
        name: null,
        image_url: null,
        price: null,
        store_name: null,
        currency: "USD",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-6 space-y-4">
      <p className="text-muted text-sm">
        Paste the link to anything you&apos;re tempted by. We&apos;ll fill in what we can.
      </p>
      <input
        type="url"
        autoFocus
        inputMode="url"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full bg-surface border border-border rounded-2xl px-4 py-3 outline-none focus:border-accent transition"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        onClick={handleNext}
        disabled={loading}
        className="w-full bg-accent text-accent-fg rounded-full py-3 font-medium hover:opacity-90 transition"
      >
        {loading ? "Reading the page..." : "Next"}
      </button>
      <button
        onClick={onSkip}
        className="w-full text-sm text-muted underline underline-offset-2"
      >
        I&apos;ll fill it in myself
      </button>
    </div>
  );
}

function PhotoButton({ onPicked }: { onPicked: (file: File) => void }) {
  return (
    <label className="w-full bg-surface border border-border rounded-3xl p-6 text-left hover:bg-accent-soft transition flex items-center gap-4 cursor-pointer">
      <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center">
        <CameraIcon />
      </div>
      <div>
        <p className="font-serif text-xl">Take a photo</p>
        <p className="text-sm text-muted">For things in stores</p>
      </div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPicked(file);
        }}
      />
    </label>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 text-foreground"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 text-foreground"
    >
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
