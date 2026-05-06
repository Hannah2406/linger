import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  answer: z.enum(["bored", "shopping", "dismissed"]),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("checkins")
    .select("answer, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    show: !data,
    last_answer: data?.answer ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await supabase.from("checkins").insert({
    user_id: user.id,
    answer: body.answer,
  });

  return NextResponse.json({ ok: true });
}
