"use client";

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
  { icon: "settings", label: "Settings", href: "/settings" },
];

export function TopBar({
  showBackArrow = false,
  backHref = "/dashboard",
  rightActions,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
          <h1 className="text-xl font-bold text-on-surface font-headline">NeuroCut</h1>
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
            <p className="text-sm font-medium text-on-surface font-headline leading-tight">User</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold leading-tight">
              250 credits
            </p>
          </div>

          {/* Profile / Logout Dropdown */}
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
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
