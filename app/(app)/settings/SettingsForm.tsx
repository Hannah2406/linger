"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function SettingsForm({
  email,
  profile,
}: {
  email: string;
  profile: Profile;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [online, setOnline] = useState(profile.default_cooldown_days_online);
  const [inperson, setInperson] = useState(
    profile.default_cooldown_days_inperson
  );
  const [bored, setBored] = useState(profile.bored_checkin_enabled);
  const [emails, setEmails] = useState(profile.email_notifications_enabled);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName || undefined,
        default_cooldown_days_online: online,
        default_cooldown_days_inperson: inperson,
        bored_checkin_enabled: bored,
        email_notifications_enabled: emails,
      }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleDelete() {
    const ok = confirm(
      "Delete your account? All your items, savings history, and emails will be erased. This can't be undone."
    );
    if (!ok) return;
    const reallyOk = confirm(
      "Last check — type-safe answer required. This wipes everything. Continue?"
    );
    if (!reallyOk) return;

    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Could not delete: ${data.error || "unknown error"}`);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="px-5 py-4 space-y-6 max-w-md">
      <Section title="Profile">
        <Row label="Email">
          <p className="text-sm text-muted">{email}</p>
        </Row>
        <Row label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm"
          />
        </Row>
      </Section>

      <Section title="Cooldown defaults">
        <Row label="Online links">
          <NumberStep value={online} onChange={setOnline} suffix="days" />
        </Row>
        <Row label="In-person photos">
          <NumberStep value={inperson} onChange={setInperson} suffix="days" />
        </Row>
      </Section>

      <Section title="Notifications">
        <Toggle
          label="Email me when cooldowns end"
          value={emails}
          onChange={setEmails}
        />
        <Toggle
          label="Daily 'bored or shopping?' check-in"
          value={bored}
          onChange={setBored}
        />
      </Section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-accent text-accent-fg rounded-full py-3 font-medium hover:opacity-90 transition"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
      {savedAt && (
        <p className="text-xs text-muted text-center">Saved at {savedAt}</p>
      )}

      <Section title="Data">
        <a
          href="/api/export"
          className="block w-full bg-surface border border-border rounded-full py-3 text-center text-sm hover:bg-accent-soft transition"
        >
          Export my data
        </a>
        <button
          onClick={handleDelete}
          className="w-full bg-surface border border-border rounded-full py-3 text-sm text-red-700 hover:bg-red-50 transition"
        >
          Delete account
        </button>
      </Section>

      <button
        onClick={handleSignOut}
        className="w-full bg-surface border border-border rounded-full py-3 text-sm text-muted hover:bg-accent-soft transition"
      >
        Sign out
      </button>

      <p className="text-center text-xs text-muted pt-4">
        Linger v0.1 · made with care
      </p>
    </div>
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
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="bg-surface border border-border rounded-3xl divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition ${
          value ? "bg-accent" : "bg-border"
        } relative`}
      >
        <span
          className={`absolute top-0.5 ${
            value ? "left-5" : "left-0.5"
          } w-5 h-5 bg-white rounded-full transition-all`}
        />
      </button>
    </Row>
  );
}

function NumberStep({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 rounded-full bg-accent-soft text-foreground"
      >
        −
      </button>
      <span className="text-sm w-16 text-center">
        {value} {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(90, value + 1))}
        className="w-7 h-7 rounded-full bg-accent-soft text-foreground"
      >
        +
      </button>
    </div>
  );
}
