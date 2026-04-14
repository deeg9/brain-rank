"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showBackArrow?: boolean;
  backHref?: string;
  rightActions?: React.ReactNode;
}

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "cloud_upload", label: "Upload", href: "/upload" },
  { icon: "trophy", label: "Discover", href: "/discover" },
];

export function TopBar({
  showBackArrow = false,
  backHref = "/dashboard",
  rightActions,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          const profile = data as { username: string | null; avatar_url: string | null } | null;
          setDisplayName(
            profile?.username ||
            (user.user_metadata?.display_name as string) ||
            user.email?.split("@")[0] ||
            "User"
          );
          if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        });
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-low flex justify-between items-center px-8 z-50 border-b border-outline-variant/10">
      {/* Left Side — Brand */}
      <div className="flex items-center gap-4">
        {showBackArrow && (
          <Link
            href={backHref}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        )}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-headline font-black text-lg tracking-widest uppercase text-on-surface">BRAIN<span className="text-on-surface-variant/40 mx-0.5">|</span>RANK</span>
        </Link>
      </div>

      {/* Right Side — Nav Icons + User */}
      {rightActions || (
        <div className="flex items-center gap-2">
          {/* Nav Icons */}
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-surface-container-highest text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="h-8 w-[1px] bg-outline-variant/20 mx-3" />

          {/* User Name + Credits */}
          <div className="text-right mr-2">
            <p className="text-sm font-medium text-on-surface font-headline leading-tight">{displayName || "User"}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold leading-tight">
              250 credits
            </p>
          </div>

          {/* Profile / Logout Dropdown */}
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">person</span>
              )}
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-44 bg-surface-container-high rounded-xl border border-outline-variant/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                Profile
              </Link>
              <Link
                href="/settings/billing"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                Billing
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Settings
              </Link>
              <Link
                href="/resources"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">science</span>
                Resources
              </Link>
              <div className="h-[1px] bg-outline-variant/10 my-1 mx-4" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-error hover:bg-surface-container-highest transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
