// Pings every external service Linger depends on. Visit /api/health in a browser
// (or `curl http://localhost:3000/api/health`) to see exactly what's wired up.
//
// Returns booleans only — no secret values. Safe to leave public.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Check = {
  name: string;
  ok: boolean;
  hint?: string;
};

export async function GET() {
  const checks: Check[] = [];

  // 1. Env vars that the app actually reads.
  const requiredEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "Find in Supabase project settings → API",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Find in Supabase project settings → API",
    SUPABASE_SERVICE_ROLE_KEY:
      "Required for account deletion and cron jobs. Supabase → API → service_role.",
    NEXT_PUBLIC_APP_URL: "Used in email links. http://localhost:3000 in dev.",
    RESEND_API_KEY: "Get a free key at resend.com — emails silently no-op without it.",
    CRON_SECRET:
      "Random string. Vercel sends it as Authorization: Bearer <secret> to cron paths.",
  };
  for (const [key, hint] of Object.entries(requiredEnv)) {
    checks.push({
      name: `env:${key}`,
      ok: !!process.env[key],
      hint: process.env[key] ? undefined : hint,
    });
  }

  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 2. Supabase connectivity (only meaningful if the keys are set).
  if (hasServiceKey && hasSupabaseUrl) {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" });
      checks.push({
        name: "supabase:profiles",
        ok: !error,
        hint: error?.message ?? undefined,
      });
    } catch (err) {
      checks.push({
        name: "supabase:profiles",
        ok: false,
        hint: err instanceof Error ? err.message : "connection failed",
      });
    }

    // 3. Migration 0002: onboarding_completed_at column exists?
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from("profiles")
        .select("onboarding_completed_at", { head: true, count: "exact" });
      checks.push({
        name: "migration:0002_onboarding",
        ok: !error,
        hint: error
          ? "Run supabase/migrations/0002_onboarding.sql in Supabase SQL editor"
          : undefined,
      });
    } catch (err) {
      checks.push({
        name: "migration:0002_onboarding",
        ok: false,
        hint: err instanceof Error ? err.message : "check failed",
      });
    }

    // 4. Storage bucket for photo uploads.
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase.storage.getBucket("item-photos");
      checks.push({
        name: "storage:item-photos",
        ok: !!data && !error,
        hint:
          data && !error
            ? undefined
            : "Create a private bucket named 'item-photos' in Supabase Storage and apply the RLS policies at the bottom of 0001_initial_schema.sql",
      });
    } catch (err) {
      checks.push({
        name: "storage:item-photos",
        ok: false,
        hint: err instanceof Error ? err.message : "bucket check failed",
      });
    }
  }

  const allOk = checks.every((c) => c.ok);
  const failing = checks.filter((c) => !c.ok).map((c) => c.name);

  return NextResponse.json(
    {
      ok: allOk,
      summary: allOk
        ? "Everything wired up."
        : `${failing.length} check${failing.length === 1 ? "" : "s"} failing: ${failing.join(", ")}`,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
