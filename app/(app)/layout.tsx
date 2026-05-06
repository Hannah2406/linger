import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TabBar from "@/components/shell/TabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto pb-24">
      {children}
      <TabBar />
    </div>
  );
}
