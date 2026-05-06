import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [profile, items, priceHistory, checkins] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("items").select("*").eq("user_id", user.id),
    supabase
      .from("price_history")
      .select("*, items!inner(user_id)")
      .eq("items.user_id", user.id),
    supabase.from("checkins").select("*").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    items: items.data ?? [],
    price_history: priceHistory.data ?? [],
    checkins: checkins.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="linger-export-${Date.now()}.json"`,
    },
  });
}
