"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface MobileNavSheetProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  avatarUrl: string | null;
  creditLabel: string;
  onLogout: () => void;
}

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "cloud_upload", label: "Upload", href: "/upload" },
  { icon: "trophy", label: "Discover", href: "/discover" },
];

const profileItems = [
  { icon: "account_circle", label: "Profile", href: "/profile" },
  { icon: "bookmark", label: "Bookmarks", href: "/bookmarks" },
  { icon: "settings", label: "Settings", href: "/settings" },
  { icon: "science", label: "Resources", href: "/resources" },
];

export function MobileNavSheet({
  open,
  onClose,
  creditLabel,
  onLogout,
}: MobileNavSheetProps) {
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const transition = reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {open && (
        <div className="md:hidden" role="presentation">
          <motion.div
            key="backdrop"
            className="fixed inset-0 top-16 bg-black/40 z-40"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-16 left-0 right-0 z-50 bg-surface-container-low border-b border-outline-variant/10 shadow-xl"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={transition}
          >
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <nav className="pt-14 px-2 pb-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 min-h-11 px-3 rounded-lg transition-colors ${
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
                    <span className="text-base font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-5 py-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                {creditLabel}
              </p>
            </div>

            <div className="h-[1px] bg-outline-variant/20 mx-4" />

            <nav className="px-2 py-2">
              {profileItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="h-[1px] bg-outline-variant/20 mx-4" />

            <div className="px-2 py-2 pb-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="text-base">Log out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
