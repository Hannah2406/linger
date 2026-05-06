import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shell/PageHeader";
import ArchiveTabs from "./ArchiveTabs";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["archived", "bought"])
    .order("decided_at", { ascending: false });

  const items = (data ?? []) as Item[];
  const archived = items.filter((i) => i.status === "archived");
  const bought = items.filter((i) => i.status === "bought");

  return (
    <main className="flex-1">
      <PageHeader title="Archive" />
      <ArchiveTabs archived={archived} bought={bought} />
    </main>
  );
}
