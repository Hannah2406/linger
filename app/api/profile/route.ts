import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Patch = z
  .object({
    display_name: z.string().min(1).max(80).optional(),
    default_cooldown_days_online: z.number().int().min(1).max(90).optional(),
    default_cooldown_days_inperson: z.number().int().min(1).max(90).optional(),
    bored_checkin_enabled: z.boolean().optional(),
    email_notifications_enabled: z.boolean().optional(),
    onboarding_completed: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data, email: user.email });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof Patch>;
  try {
    body = Patch.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid body", detail: err instanceof Error ? err.message : "" },
      { status: 400 }
    );
  }

  const { onboarding_completed, ...rest } = body;
  const update: Record<string, unknown> = { ...rest };
  if (onboarding_completed === true) {
    update.onboarding_completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
