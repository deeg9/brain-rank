import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout";
import { OfflineDetector } from "@/components/OfflineDetector";
import { IdentifyUser } from "@/components/IdentifyUser";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <IdentifyUser userId={user.id} email={user.email ?? null} />
      {children}
      <OfflineDetector />
    </AppShell>
  );
}
