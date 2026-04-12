"use client";
import { useState } from "react";

export function VisibilityToggle({ jobId, initialPublic }: { jobId: string; initialPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [updating, setUpdating] = useState(false);

  async function handleToggle() {
    setUpdating(true);
    const newValue = !isPublic;
    setIsPublic(newValue); // optimistic
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: newValue }),
      });
      if (!res.ok) setIsPublic(!newValue); // revert
    } catch {
      setIsPublic(!newValue); // revert
    }
    setUpdating(false);
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
      disabled={updating}
      className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
      title={isPublic ? "Public - click to make private" : "Private - click to make public"}
    >
      <span className="material-symbols-outlined text-sm">
        {isPublic ? "public" : "lock"}
      </span>
      {isPublic && (
        <span className="text-[10px] font-headline uppercase tracking-widest font-bold text-primary">Public</span>
      )}
    </button>
  );
}
