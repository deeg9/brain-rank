"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "cloud_upload", label: "Upload", href: "/upload" },
  { icon: "bookmark", label: "Bookmarks", href: "/bookmarks" },
  { icon: "settings", label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activeRoute?: string;
}

export function Sidebar({ activeRoute }: SidebarProps) {
  const pathname = usePathname();
  const currentRoute = activeRoute || pathname;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low font-headline text-sm tracking-tight flex flex-col p-6 z-50">
      {/* Brand Header */}
      <div className="mb-10">
        <h1 className="text-xl font-bold text-on-surface">NeuroCut</h1>
        <p className="text-on-surface-variant text-xs mt-1 uppercase tracking-widest">
          Pro Plan
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {mainNavItems.map((item) => {
          const isActive = currentRoute === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-surface-container text-on-surface font-semibold border-l-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        {/* New Analysis CTA */}
        <button className="w-full neural-gradient py-3 rounded-lg font-bold text-on-surface shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
          New Analysis
        </button>

        {/* User Profile */}
        <div className="mt-6 flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="text-on-surface font-medium truncate">User</p>
            <p className="text-on-surface-variant text-xs truncate">
              user@neurocut.io
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
