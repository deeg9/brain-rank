"use client";

import Link from "next/link";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showBackArrow?: boolean;
  backHref?: string;
  rightActions?: React.ReactNode;
}

export function TopBar({
  title,
  showSearch = false,
  showBackArrow = false,
  backHref = "/dashboard",
  rightActions,
}: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-surface flex justify-between items-center px-8 z-40">
      {/* Left Side */}
      <div className="flex items-center gap-4 flex-1">
        {showBackArrow && (
          <Link
            href={backHref}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        )}
        {showSearch ? (
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="Search analyses..."
              type="text"
            />
          </div>
        ) : title ? (
          <h1 className="font-headline font-bold text-lg text-on-surface">
            {title}
          </h1>
        ) : null}
      </div>

      {/* Right Side */}
      {rightActions || (
        <div className="flex items-center gap-6">
          {/* Credits Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded-full border border-outline-variant/10">
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold">
              Credits: 1,240
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">
              notifications
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">
              help_outline
            </button>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-outline-variant/20 mx-2" />

            {/* Upgrade */}
            <button className="text-primary font-headline text-[10px] uppercase tracking-widest font-bold hover:opacity-80 transition-opacity">
              Upgrade
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden" />
          </div>
        </div>
      )}
    </header>
  );
}
