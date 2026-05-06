import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";

const CreateItem = z.object({
  source_type: z.enum(["url", "photo"]),
  source_url: z.string().url().optional().nullable(),
  store_name: z.string().max(120).optional().nullable(),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  name: z.string().min(1).max(280),
  image_url: z.string().url().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  price_added: z.number().nonnegative(),
  price_currency: z.string().min(3).max(3).default("USD"),
  cooldown_days: z.number().int().min(1).max(90),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("cooldown_ends_at", { ascending: true });

  if (status) {
    const statuses = status.split(",");
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof CreateItem>;
  try {
    body = CreateItem.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid body", detail: err instanceof Error ? err.message : "" },
      { status: 400 }
    );
  }

  // Duplicate detection: if user already has an active item with the same
  // source_url, return the existing one instead of creating a copy.
  if (body.source_url) {
    const { data: existing } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_url", body.source_url)
      .in("status", ["active", "pending_decision"])
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { item: existing, duplicate: true },
        { status: 200 }
      );
    }
  }

  const cooldownEnds = new Date(
    Date.now() + body.cooldown_days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      source_type: body.source_type,
      source_url: body.source_url ?? null,
      store_name: body.store_name ?? null,
      category: body.category,
      name: body.name,
      image_url: body.image_url ?? null,
      reason: body.reason ?? null,
      price_added: body.price_added,
      price_current: body.price_added,
      price_currency: body.price_currency,
      cooldown_ends_at: cooldownEnds,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}
