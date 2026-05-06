"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, type ItemCategory } from "@/lib/types";

export type ItemFormValues = {
  source_url?: string;
  name: string;
  image_url?: string;
  store_name?: string;
  category: ItemCategory;
  price_added: number;
  price_currency: string;
  reason?: string;
  cooldown_days: number;
  photoFile?: File;
};

const COOLDOWN_OPTIONS = [
  { days: 1, label: "24 hours" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
];

export default function ItemForm({
  initial,
  defaultCooldownDays,
  submitting,
  onSubmit,
  showUrlField,
  requirePhoto,
}: {
  initial: Partial<ItemFormValues>;
  defaultCooldownDays: number;
  submitting: boolean;
  onSubmit: (values: ItemFormValues) => void;
  showUrlField: boolean;
  requirePhoto: boolean;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [storeName, setStoreName] = useState(initial.store_name ?? "");
  const [category, setCategory] = useState<ItemCategory>(
    (initial.category as ItemCategory) ?? "clothes"
  );
  const [price, setPrice] = useState(
    initial.price_added !== undefined ? String(initial.price_added) : ""
  );
  const [reason, setReason] = useState(initial.reason ?? "");
  const [cooldown, setCooldown] = useState<number>(
    initial.cooldown_days ?? defaultCooldownDays
  );
  const [customDays, setCustomDays] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-upload the photo (if one was passed in via the photo flow) once on mount.
  const uploadStartedRef = useRef(false);
  useEffect(() => {
    if (!initial.photoFile || imageUrl || uploadStartedRef.current) return;
    uploadStartedRef.current = true;
    const file = initial.photoFile;
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    fetch("/api/items/upload-photo", { method: "POST", body: form })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "upload failed");
        setImageUrl(data.url);
      })
      .catch((err) =>
        setUploadError(err instanceof Error ? err.message : "upload failed")
      )
      .finally(() => setUploading(false));
  }, [initial.photoFile, imageUrl]);

  const isCustomSelected =
    !COOLDOWN_OPTIONS.some((o) => o.days === cooldown);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (!name.trim() || Number.isNaN(priceNum) || priceNum < 0) return;

    onSubmit({
      source_url: initial.source_url,
      name: name.trim(),
      image_url: imageUrl || undefined,
      store_name: storeName || undefined,
      category,
      price_added: priceNum,
      price_currency: initial.price_currency || "USD",
      reason: reason.trim() || undefined,
      cooldown_days: Math.min(90, Math.max(1, Math.round(cooldown))),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {imageUrl ? (
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-accent-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] rounded-2xl bg-accent-soft flex items-center justify-center text-muted">
          {uploading ? "Uploading..." : "No photo yet"}
        </div>
      )}
      {uploadError && (
        <p className="text-sm text-red-700">{uploadError}</p>
      )}
      {requirePhoto && !imageUrl && !uploading && (
        <p className="text-sm text-muted">A photo helps you remember it.</p>
      )}

      <Field label="Item name">
        <input
          type="text"
          required
          maxLength={280}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
          placeholder="What is it?"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              $
            </span>
            <input
              type="number"
              required
              inputMode="decimal"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input pl-7"
              placeholder="0.00"
            />
          </div>
        </Field>
        <Field label="Store">
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="form-input"
            placeholder="(optional)"
          />
        </Field>
      </div>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ItemCategory)}
          className="form-input"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="How long do you want to wait?">
        <div className="grid grid-cols-4 gap-2">
          {COOLDOWN_OPTIONS.map((opt) => {
            const active = cooldown === opt.days && !isCustomSelected;
            return (
              <button
                type="button"
                key={opt.days}
                onClick={() => {
                  setCooldown(opt.days);
                  setCustomDays("");
                }}
                className={`py-3 rounded-2xl border text-sm transition ${
                  active
                    ? "bg-accent text-accent-fg border-accent"
                    : "bg-surface border-border hover:bg-accent-soft"
                }`}
              >
                {opt.label}
                {opt.days === defaultCooldownDays && !active && (
                  <span className="block text-[10px] text-muted">recommended</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted">or</span>
          <input
            type="number"
            min="1"
            max="90"
            placeholder="Custom days"
            value={customDays}
            onChange={(e) => {
              const v = e.target.value;
              setCustomDays(v);
              const n = parseInt(v, 10);
              if (!Number.isNaN(n) && n >= 1 && n <= 90) setCooldown(n);
            }}
            className="form-input w-32"
          />
        </div>
      </Field>

      <Field label="Why do you want this? (optional)">
        <input
          type="text"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="form-input"
          placeholder="Helpful future-you context"
        />
      </Field>

      {showUrlField && initial.source_url && (
        <p className="text-xs text-muted truncate">
          Source: {initial.source_url}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full bg-accent text-accent-fg rounded-full py-3.5 font-medium hover:opacity-90 transition"
      >
        {submitting ? "Saving..." : "Save to Linger"}
      </button>

      <style jsx>{`
        .form-input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 150ms;
        }
        .form-input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
