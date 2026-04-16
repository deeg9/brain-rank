"use client";

export interface MobileNavSheetProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  avatarUrl: string | null;
  creditLabel: string;
  onLogout: () => void;
}

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 top-16 z-40 bg-surface-container-lowest">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-on-surface-variant"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
      <p className="p-8 text-center text-on-surface-variant">
        Mobile nav — full implementation in Plan 02
      </p>
    </div>
  );
}
