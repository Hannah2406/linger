import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shell/PageHeader";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex-1">
      <PageHeader title="Settings" back="/home" />
      <SettingsForm
        email={user.email ?? ""}
        profile={profile ?? {
          id: user.id,
          display_name: null,
          default_cooldown_days_online: 7,
          default_cooldown_days_inperson: 3,
          bored_checkin_enabled: true,
          email_notifications_enabled: true,
          created_at: "",
          updated_at: "",
        }}
      />
    </main>
  );
}
