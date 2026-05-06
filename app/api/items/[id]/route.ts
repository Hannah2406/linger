import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import { sendEmail } from "@/lib/email/client";
import { milestoneEmail } from "@/lib/email/templates";
import { translateAmountCompound } from "@/lib/translations";

const MILESTONES = [100, 500, 1000, 2500, 5000];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function maybeSendMilestone(
  supabase: SupabaseServerClient,
  userId: string,
  email: string | undefined
) {
  const [archivedRes, sentRes, profileRes] = await Promise.all([
    supabase
      .from("items")
      .select("price_added, price_currency")
      .eq("user_id", userId)
      .eq("status", "archived"),
    supabase
      .from("notifications_sent")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "milestone"),
    supabase
      .from("profiles")
      .select("email_notifications_enabled")
      .eq("id", userId)
      .single(),
  ]);

  const archived = archivedRes.data ?? [];
  const total = archived.reduce((s, r) => s + Number(r.price_added), 0);
  const currency = archived[0]?.price_currency || "USD";
  let sent = sentRes.count ?? 0;
  const emailsOn = profileRes.data?.email_notifications_enabled ?? true;

  while (sent < MILESTONES.length && total >= MILESTONES[sent]) {
    const threshold = MILESTONES[sent];
    if (emailsOn && email) {
      try {
        const { subject, html } = milestoneEmail({
          threshold,
          total,
          translation: translateAmountCompound(threshold),
          currency,
        });
        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error("[milestone] email failed", userId, threshold, err);
      }
    }
    await supabase.from("notifications_sent").insert({
      user_id: userId,
      kind: "milestone",
    });
    sent++;
  }
}

const PatchItem = z
  .object({
    action: z
      .enum(["decide_yes", "decide_no", "extend", "override"])
      .optional(),
    extend_days: z.number().int().min(1).max(90).optional(),
    name: z.string().min(1).max(280).optional(),
    image_url: z.string().url().nullable().optional(),
    reason: z.string().max(500).nullable().optional(),
    category: z.enum(CATEGORIES as [string, ...string[]]).optional(),
    price_added: z.number().nonnegative().optional(),
    store_name: z.string().max(120).nullable().optional(),
  })
  .strict();

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ item: data });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof PatchItem>;
  try {
    body = PatchItem.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid body", detail: err instanceof Error ? err.message : "" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (existingError || !existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  if (body.action === "decide_yes" || body.action === "override") {
    update.status = "bought";
    update.decided_at = new Date().toISOString();
    if (body.action === "override") update.override_used = true;
  } else if (body.action === "decide_no") {
    update.status = "archived";
    update.decided_at = new Date().toISOString();
  } else if (body.action === "extend") {
    const days =
      body.extend_days ??
      Math.max(
        1,
        Math.round(
          (new Date(existing.cooldown_ends_at).getTime() -
            new Date(existing.cooldown_started_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
    update.cooldown_ends_at = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toISOString();
    update.status = "active";
    update.cooldown_extended_count = (existing.cooldown_extended_count || 0) + 1;
  }

  // Plain field edits
  for (const key of [
    "name",
    "image_url",
    "reason",
    "category",
    "price_added",
    "store_name",
  ] as const) {
    if (key in body && body[key] !== undefined) {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ item: existing });
  }

  const { data, error } = await supabase
    .from("items")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.action === "decide_no") {
    // Fire-and-forget: don't block the response on Resend.
    maybeSendMilestone(supabase, user.id, user.email).catch((err) =>
      console.error("[milestone] check failed", err)
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { error } = await supabase
    .from("items")
    .update({ status: "deleted" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
