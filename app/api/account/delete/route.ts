// Hard-delete the signed-in user's auth account. The auth.users row cascades
// to profiles, items, price_history, notifications_sent, checkins via FK.
//
// Requires SUPABASE_SERVICE_ROLE_KEY because deletion uses the admin API.
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sign out client-side; we also want the session cookie cleared on this request.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
