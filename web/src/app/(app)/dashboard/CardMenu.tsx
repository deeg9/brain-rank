"use client";

import { useState, useRef, useEffect } from "react";
import { CONTENT_CATEGORIES } from "@/lib/categories";

interface CardMenuProps {
  jobId: string;
  jobTitle: string;
  isPublic: boolean;
  category?: string | null;
}

export function CardMenu({ jobId, jobTitle, isPublic, category }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(jobTitle);
  const [editPublic, setEditPublic] = useState(isPublic);
  const [editCategory, setEditCategory] = useState(category || "");
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Lock body scroll when edit modal is open
  useEffect(() => {
    if (showEdit) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [showEdit]);

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

  function openEdit() {
    setEditTitle(jobTitle);
    setEditPublic(isPublic);
    setEditCategory(category || "");
    setOpen(false);
    setShowEdit(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          is_public: editPublic,
          category: editCategory || null,
        }),
      });
      if (res.ok) {
        setShowEdit(false);
        window.location.reload();
        return;
      }
    } catch {
      // silently fail
    }
    setSaving(false);
  }

  return (
    <>
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openEdit();
              }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Edit
            </button>
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

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg">Edit Analysis</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 focus:border-black focus:outline-none"
                maxLength={200}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Visibility</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditPublic(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    !editPublic ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Private
                </button>
                <button
                  onClick={() => setEditPublic(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    editPublic ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Public
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 focus:border-black focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">No category</option>
                {CONTENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
