"use client";

import { useState, useTransition } from "react";
import {
  detectPlatform,
  platformIcon,
  platformLabel,
  platformShowsShares,
  viewsLabel,
  formatCount,
  type PostedPlatform,
} from "@/lib/post-engagement";
import { updateJobEngagement } from "@/app/(app)/upload/actions";

interface EngagementCardProps {
  jobId: string;
  isOwner: boolean;
  postedUrl: string | null;
  postedPlatform: PostedPlatform | null;
  postedAt: string | null;
  viewsCount: number | null;
  likesCount: number | null;
  commentsCount: number | null;
  sharesCount: number | null;
  engagementCapturedAt: string | null;
}

// Visible on the public analysis page to any visitor.
// - Owners see: link chip + counts + "as of" + [Update] button (inline form).
// - Non-owners see: link chip only — numbers hidden to discourage self-reporting noise on public surfaces.
// - Owners with no url yet see: "Add real-world performance" affordance.
// - Non-owners with no url: renders nothing.
export function EngagementCard(props: EngagementCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    postedUrl: props.postedUrl ?? "",
    postedAt: props.postedAt ?? "",
    viewsCount: props.viewsCount != null ? String(props.viewsCount) : "",
    likesCount: props.likesCount != null ? String(props.likesCount) : "",
    commentsCount: props.commentsCount != null ? String(props.commentsCount) : "",
    sharesCount: props.sharesCount != null ? String(props.sharesCount) : "",
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local snapshot so the UI reflects saved values without a page refresh.
  const [saved, setSaved] = useState({
    postedUrl: props.postedUrl,
    postedPlatform: props.postedPlatform,
    postedAt: props.postedAt,
    viewsCount: props.viewsCount,
    likesCount: props.likesCount,
    commentsCount: props.commentsCount,
    sharesCount: props.sharesCount,
    engagementCapturedAt: props.engagementCapturedAt,
  });

  const detected = detectPlatform(form.postedUrl);
  const liveUrl = saved.postedUrl;
  const livePlatform = saved.postedPlatform ?? detectPlatform(liveUrl);

  // Non-owner + no link: nothing to show.
  if (!props.isOwner && !liveUrl) return null;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = {
        postedUrl: form.postedUrl.trim() || null,
        postedAt: form.postedAt || null,
        viewsCount: form.viewsCount === "" ? null : Number(form.viewsCount),
        likesCount: form.likesCount === "" ? null : Number(form.likesCount),
        commentsCount: form.commentsCount === "" ? null : Number(form.commentsCount),
        sharesCount: form.sharesCount === "" ? null : Number(form.sharesCount),
      };
      const result = await updateJobEngagement(props.jobId, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved({
        postedUrl: payload.postedUrl,
        postedPlatform: detectPlatform(payload.postedUrl) ?? null,
        postedAt: payload.postedAt,
        viewsCount: payload.viewsCount,
        likesCount: payload.likesCount,
        commentsCount: payload.commentsCount,
        sharesCount: payload.sharesCount,
        engagementCapturedAt: result.capturedAt,
      });
      setEditing(false);
    });
  }

  function handleCancel() {
    setForm({
      postedUrl: saved.postedUrl ?? "",
      postedAt: saved.postedAt ?? "",
      viewsCount: saved.viewsCount != null ? String(saved.viewsCount) : "",
      likesCount: saved.likesCount != null ? String(saved.likesCount) : "",
      commentsCount: saved.commentsCount != null ? String(saved.commentsCount) : "",
      sharesCount: saved.sharesCount != null ? String(saved.sharesCount) : "",
    });
    setError(null);
    setEditing(false);
  }

  // ---------------- Editing form (owner only) ----------------
  if (editing) {
    return (
      <div className="rounded-xl p-5 border border-gray-200 bg-white space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-700 text-lg">share</span>
          <h3 className="font-headline text-base font-bold text-black">
            Real-world performance
          </h3>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
            Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              inputMode="url"
              placeholder="https://www.tiktok.com/@you/video/..."
              value={form.postedUrl}
              onChange={(e) => setForm({ ...form, postedUrl: e.target.value })}
              disabled={pending}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
            />
            {detected && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-[10px] uppercase tracking-widest font-bold text-gray-600">
                {platformLabel(detected)}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
            Date posted
          </label>
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            min="2010-01-01"
            value={form.postedAt}
            onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
            disabled={pending}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
              {viewsLabel(detected)}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={form.viewsCount}
              onChange={(e) => setForm({ ...form, viewsCount: e.target.value })}
              disabled={pending}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
              Likes
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={form.likesCount}
              onChange={(e) => setForm({ ...form, likesCount: e.target.value })}
              disabled={pending}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
              Comments
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={form.commentsCount}
              onChange={(e) => setForm({ ...form, commentsCount: e.target.value })}
              disabled={pending}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
            />
          </div>
          {(!detected || platformShowsShares(detected)) && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
                Shares
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={form.sharesCount}
                onChange={(e) => setForm({ ...form, sharesCount: e.target.value })}
                disabled={pending}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="px-4 py-2 rounded-lg bg-black text-white text-xs font-headline font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-headline font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Owner but no link yet: add affordance ----------------
  if (props.isOwner && !liveUrl) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-xl p-5 border border-dashed border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
      >
        <span className="material-symbols-outlined text-gray-500">add_link</span>
        <div>
          <p className="text-sm font-bold text-black">Add real-world performance</p>
          <p className="text-xs text-gray-500">
            Share where you posted this content and how it performed. Helps the research dataset.
          </p>
        </div>
      </button>
    );
  }

  // ---------------- Read-only view ----------------
  const platform: PostedPlatform = livePlatform ?? "other";

  // Owner-only numeric stat display.
  const statsVisible =
    props.isOwner &&
    (saved.viewsCount != null ||
      saved.likesCount != null ||
      saved.commentsCount != null ||
      saved.sharesCount != null);

  return (
    <div className="rounded-xl p-5 border border-gray-200 bg-white space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-gray-700 text-lg shrink-0">share</span>
          <h3 className="font-headline text-base font-bold text-black truncate">
            Real-world performance
          </h3>
        </div>
        {props.isOwner && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-black transition-colors"
          >
            Update
          </button>
        )}
      </div>

      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-black/30 transition-colors text-xs text-gray-700 max-w-full"
        >
          <span className="material-symbols-outlined text-base shrink-0">
            {platformIcon(platform)}
          </span>
          <span className="font-bold">{platformLabel(platform)}</span>
          <span className="text-gray-400 truncate">{stripUrlProtocol(liveUrl)}</span>
        </a>
      )}

      {statsVisible && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <Stat label={viewsLabel(platform)} value={saved.viewsCount} />
          <Stat label="Likes" value={saved.likesCount} />
          <Stat label="Comments" value={saved.commentsCount} />
          {platformShowsShares(platform) && (
            <Stat label="Shares" value={saved.sharesCount} />
          )}
        </div>
      )}

      {props.isOwner && (saved.postedAt || saved.engagementCapturedAt) && (
        <p className="text-[10px] text-gray-400 leading-snug">
          {saved.postedAt && `Posted ${formatDate(saved.postedAt)}`}
          {saved.postedAt && saved.engagementCapturedAt && " · "}
          {saved.engagementCapturedAt &&
            `Metrics as of ${formatDate(saved.engagementCapturedAt)}`}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
        {label}
      </p>
      <p className="text-lg font-headline font-bold text-black">{formatCount(value)}</p>
    </div>
  );
}

function stripUrlProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
