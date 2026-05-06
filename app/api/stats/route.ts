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

  const { data: archived } = await supabase
    .from("items")
    .select("price_added, decided_at")
    .eq("user_id", user.id)
    .eq("status", "archived");

  const total = (archived ?? []).reduce(
    (sum, r) => sum + Number(r.price_added),
    0
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  const month = (archived ?? [])
    .filter((r) => r.decided_at && new Date(r.decided_at).getTime() >= monthStart)
    .reduce((s, r) => s + Number(r.price_added), 0);

  const year = (archived ?? [])
    .filter((r) => r.decided_at && new Date(r.decided_at).getTime() >= yearStart)
    .reduce((s, r) => s + Number(r.price_added), 0);

  return NextResponse.json({
    total_kept: Math.round(total * 100) / 100,
    month_kept: Math.round(month * 100) / 100,
    year_kept: Math.round(year * 100) / 100,
    items_kept: archived?.length ?? 0,
  });
}
