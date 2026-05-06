// Daily cron: re-scrape active items, log price history, fire notifications.
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractItem } from "@/lib/scraping/dispatch";
import { sendEmail } from "@/lib/email/client";
import { priceDropEmail, lowStockEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET;
  return !!secret && auth === `Bearer ${secret}`;
}

const STALE_HOURS = 20;
const PRICE_DROP_THRESHOLD = 0.9; // alert if new price < 90% of price_added
const BATCH_LIMIT = 50;

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(
    Date.now() - STALE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: items, error } = await supabase
    .from("items")
    .select(
      "id, user_id, source_url, name, price_added, price_current, price_currency, is_in_stock, cooldown_ends_at"
    )
    .eq("status", "active")
    .not("source_url", "is", null)
    .or(`last_price_check_at.is.null,last_price_check_at.lte.${cutoff}`)
    .limit(BATCH_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let scraped = 0;
  let drops = 0;

  for (const item of items ?? []) {
    if (!item.source_url) continue;
    const result = await extractItem(item.source_url);
    const now = new Date().toISOString();

    const newPrice = result.price ?? null;
    const inStock = result.success && result.name !== null;

    await supabase
      .from("items")
      .update({
        price_current: newPrice ?? item.price_current,
        is_in_stock: inStock,
        last_price_check_at: now,
      })
      .eq("id", item.id);

    if (newPrice !== null) {
      await supabase.from("price_history").insert({
        item_id: item.id,
        price: newPrice,
        is_in_stock: inStock,
      });
    }

    scraped++;

    // Notifications — best effort
    const wasInStock = item.is_in_stock !== false;
    const goneOutOfStock = wasInStock && !inStock;
    const droppedSignificantly =
      newPrice !== null &&
      newPrice < Number(item.price_added) * PRICE_DROP_THRESHOLD;

    if (droppedSignificantly || goneOutOfStock) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_notifications_enabled")
        .eq("id", item.user_id)
        .single();
      if (!profile?.email_notifications_enabled) continue;

      const { data: authUser } = await supabase.auth.admin.getUserById(
        item.user_id
      );
      const email = authUser?.user?.email;
      if (!email) continue;

      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(item.cooldown_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );

      if (droppedSignificantly && newPrice !== null) {
        const { data: alreadySent } = await supabase
          .from("notifications_sent")
          .select("id")
          .eq("item_id", item.id)
          .eq("kind", "price_drop")
          .maybeSingle();
        if (!alreadySent) {
          const { subject, html } = priceDropEmail({
            itemId: item.id,
            itemName: item.name,
            oldPrice: Number(item.price_added),
            newPrice,
            currency: item.price_currency,
            daysLeft,
          });
          try {
            await sendEmail({ to: email, subject, html });
            await supabase.from("notifications_sent").insert({
              user_id: item.user_id,
              item_id: item.id,
              kind: "price_drop",
            });
            drops++;
          } catch (err) {
            console.error("[cron/check-prices] email failed", item.id, err);
          }
        }
      }

      if (goneOutOfStock) {
        const { data: alreadySent } = await supabase
          .from("notifications_sent")
          .select("id")
          .eq("item_id", item.id)
          .eq("kind", "low_stock")
          .maybeSingle();
        if (!alreadySent) {
          const { subject, html } = lowStockEmail({
            itemId: item.id,
            itemName: item.name,
            daysLeft,
          });
          try {
            await sendEmail({ to: email, subject, html });
            await supabase.from("notifications_sent").insert({
              user_id: item.user_id,
              item_id: item.id,
              kind: "low_stock",
            });
          } catch (err) {
            console.error("[cron/check-prices] email failed", item.id, err);
          }
        }
      }
    }

    // Tiny delay to avoid hammering origins back-to-back
    await new Promise((r) => setTimeout(r, 250));
  }

  return NextResponse.json({ scraped, drops });
}
