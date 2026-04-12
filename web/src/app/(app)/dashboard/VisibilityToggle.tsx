"use client";
import { useState } from "react";

export function VisibilityToggle({ jobId, initialPublic, viewCount }: { jobId: string; initialPublic: boolean; viewCount?: number }) {
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
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
        disabled={updating}
        className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
        title={isPublic ? "Public - click to make private" : "Private - click to make public"}
      >
        <span className="material-symbols-outlined text-sm text-black">
          {isPublic ? "public" : "lock"}
        </span>
        <span className="text-[10px] font-headline uppercase tracking-widest font-bold text-black">
          {isPublic ? "Public" : "Private"}
        </span>
      </button>
      {isPublic && viewCount !== undefined && (
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="material-symbols-outlined text-sm">visibility</span>
          {viewCount}
        </span>
      )}
    </div>
  );
}
