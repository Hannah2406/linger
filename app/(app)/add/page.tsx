import { createClient } from "@/lib/supabase/server";
import AddFlow from "./AddFlow";

export default async function AddPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_cooldown_days_online, default_cooldown_days_inperson")
    .single();

  return (
    <AddFlow
      defaultOnline={profile?.default_cooldown_days_online ?? 7}
      defaultInperson={profile?.default_cooldown_days_inperson ?? 3}
    />
  );
}
