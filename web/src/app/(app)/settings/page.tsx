import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const email = user.email ?? "";
  const displayName =
    (user.user_metadata?.display_name as string) ||
    email.split("@")[0] ||
    "User";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-10 pt-6">
      <header className="mb-12">
        <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-on-surface-variant">
          Manage your account, security, and notification preferences.
        </p>
      </header>

      <SettingsForm
        email={email}
        displayName={displayName}
        currentUsername={profile?.username ?? null}
      />
    </div>
  );
}
