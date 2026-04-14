"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CardMenuProps {
  jobId: string;
  jobTitle: string;
  isPublic: boolean;
}

export function CardMenu({ jobId, jobTitle, isPublic }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const body = await res.json().catch(() => null);
      console.error("Delete failed:", res.status, body);
    } catch (err) {
      console.error("Delete error:", err);
    }
    setOpen(false);
    setConfirming(false);
  }

  function handleShare() {
    const url = `${window.location.origin}/analysis/${jobId}`;
    navigator.clipboard.writeText(url);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
          setConfirming(false);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-50">
          {isPublic && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
            >
              <span className="material-symbols-outlined text-base">share</span>
              Copy Link
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm w-full text-left transition-colors ${
              confirming ? "text-red-600 bg-red-50" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-base">delete</span>
            {confirming ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
