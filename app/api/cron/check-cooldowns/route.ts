// Hourly cron: mark items whose cooldowns ended as pending_decision and email the user.
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { cooldownEndedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET;
  return !!secret && auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Find active items whose cooldowns ended
  const { data: items, error } = await supabase
    .from("items")
    .select("id, user_id, name, image_url, price_added, price_currency")
    .eq("status", "active")
    .lte("cooldown_ends_at", nowIso)
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let emailed = 0;

  for (const item of items ?? []) {
    // Mark as pending_decision
    await supabase
      .from("items")
      .update({ status: "pending_decision" })
      .eq("id", item.id);
    processed++;

    // Skip if we've already sent a cooldown_ended email for this item
    const { data: existing } = await supabase
      .from("notifications_sent")
      .select("id")
      .eq("item_id", item.id)
      .eq("kind", "cooldown_ended")
      .maybeSingle();
    if (existing) continue;

    // Get user email + notification preference
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      supabase
        .from("profiles")
        .select("email_notifications_enabled")
        .eq("id", item.user_id)
        .single(),
      supabase.auth.admin.getUserById(item.user_id),
    ]);
    if (!profile?.email_notifications_enabled) continue;
    const email = authUser?.user?.email;
    if (!email) continue;

    const { subject, html } = cooldownEndedEmail({
      itemId: item.id,
      itemName: item.name,
      itemImage: item.image_url,
      price: Number(item.price_added),
      currency: item.price_currency,
    });

    try {
      await sendEmail({ to: email, subject, html });
      await supabase.from("notifications_sent").insert({
        user_id: item.user_id,
        item_id: item.id,
        kind: "cooldown_ended",
      });
      emailed++;
    } catch (err) {
      console.error("[cron/check-cooldowns] email failed", item.id, err);
    }
  }

  return NextResponse.json({ processed, emailed });
}
