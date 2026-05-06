import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCooldownEnded } from "@/lib/format";
import type { Item } from "@/lib/types";
import ItemDetail from "./ItemDetail";
import DecisionMoment from "./DecisionMoment";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item) notFound();
  const typed = item as Item;

  // If cooldown ended OR status is pending_decision, show the decision moment.
  if (
    typed.status === "pending_decision" ||
    (typed.status === "active" && isCooldownEnded(typed.cooldown_ends_at))
  ) {
    return <DecisionMoment item={typed} />;
  }

  return <ItemDetail item={typed} />;
}
