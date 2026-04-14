"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Input } from "@/components/ui";
import {
  resizeToAvatar,
  uploadAvatar,
  getInitials,
  getInitialsColor,
} from "@/lib/avatar";

interface NotificationPrefs {
  analysisComplete: boolean;
  processingFailed: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

const STORAGE_KEY = "neurocut_notification_prefs";

const defaultPrefs: NotificationPrefs = {
  analysisComplete: true,
  processingFailed: true,
  weeklySummary: false,
  productUpdates: true,
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-black" : "bg-gray-300"
      }`}
    >
      <span
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out bg-white`}
      />
    </button>
  );
}

interface SettingsFormProps {
  email: string;
  displayName: string;
  currentUsername: string | null;
  currentAvatarUrl: string | null;
  currentBio: string | null;
  userId: string;
}

export function SettingsForm({
  email,
  displayName,
  currentUsername,
  currentAvatarUrl,
  currentBio,
  userId,
}: SettingsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [username, setUsername] = useState(currentUsername ?? "");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bio state
  const [bio, setBio] = useState(currentBio ?? "");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setAvailability(null);
      return;
    }
    if (username === currentUsername) {
      setAvailability(null);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/check?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        setAvailability(data);
      } catch {
        setAvailability(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      setChecking(false);
    };
  }, [username, currentUsername]);

  // Avatar file selection handler (preview only, no upload)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    e.target.value = "";

    setAvatarError(null);

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be under 2MB");
      return;
    }

    try {
      const resizedBlob = await resizeToAvatar(file);
      setPendingAvatarBlob(resizedBlob);
      setAvatarPreviewUrl(URL.createObjectURL(resizedBlob));
    } catch {
      setAvatarError("Failed to process image");
    }
  }

  // Confirm avatar upload
  async function handleAvatarConfirm() {
    if (!pendingAvatarBlob) return;

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const url = await uploadAvatar(pendingAvatarBlob, userId);

      // Persist avatar_url to profile
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });

      setAvatarUrl(url);

      // Clean up preview
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);
      setPendingAvatarBlob(null);
    } catch {
      setAvatarError("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }

  // Cancel avatar preview
  function handleAvatarCancel() {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setPendingAvatarBlob(null);
    setAvatarError(null);
  }

  // Save profile (username + bio)
  const usernameChanged =
    username !== (currentUsername ?? "") &&
    username.length >= 3 &&
    (availability === null || availability.available);
  const bioChanged = bio.trim() !== (currentBio ?? "");
  const canSave = (usernameChanged || bioChanged) && !saving && !checking;

  async function handleSaveProfile() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const patchBody: Record<string, unknown> = {};

      if (usernameChanged) {
        patchBody.username = username.toLowerCase();
      }
      if (bioChanged) {
        patchBody.bio = bio.trim() || null;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save profile");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }

  // Bio character counter color
  const bioCounterColor =
    bio.length >= 160
      ? "text-red-500"
      : bio.length >= 140
        ? "text-orange-500"
        : "text-on-surface-variant";

  return (
    <div className="space-y-8">
      {/* Section: Profile Information */}
      <section className="p-8 rounded-xl glass-surface relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-bold text-black mb-2">
              Profile Information
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Update your public identity and account contact details.
            </p>
          </div>
          <div className="flex-1 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                disabled={avatarUploading}
              >
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                    <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                  </div>
                )}

                {/* Upload spinner overlay */}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Hover overlay (only when not uploading and no preview) */}
                {!avatarUploading && !avatarPreviewUrl && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      photo_camera
                    </span>
                  </div>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Preview confirm/cancel buttons */}
              {avatarPreviewUrl && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAvatarConfirm}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? "Uploading..." : "Confirm"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleAvatarCancel}
                    disabled={avatarUploading}
                    className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Change photo label (when no preview) */}
              {!avatarPreviewUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  Change photo
                </button>
              )}

              {/* Error message */}
              {avatarError && (
                <p className="text-xs text-red-500">{avatarError}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-black font-bold">
                Username
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-on-surface focus:bg-white focus:border-black focus:ring-0 transition-all"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                  )
                }
                maxLength={20}
                placeholder="choose_a_username"
              />
              <div className="min-h-[20px]">
                {checking && (
                  <p className="text-xs text-on-surface-variant">Checking...</p>
                )}
                {!checking && availability?.available === true && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Username available
                  </p>
                )}
                {!checking && availability?.available === false && (
                  <p className="text-xs text-red-500">{availability.reason}</p>
                )}
                {!checking &&
                  !availability &&
                  username.length > 0 &&
                  username.length < 3 && (
                    <p className="text-xs text-on-surface-variant">
                      Must be at least 3 characters
                    </p>
                  )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-black font-bold">
                Bio
              </label>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-on-surface focus:bg-white focus:border-black focus:ring-0 transition-all resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Tell us about your content..."
              />
              <div className="flex justify-end">
                <span className={`text-xs ${bioCounterColor}`}>
                  {bio.length}/160
                </span>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-black font-bold">
                Email Address
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed">
                <span className="flex-1">{email}</span>
                <span className="material-symbols-outlined text-sm">lock</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/60 italic">
                Email cannot be changed.
              </p>
            </div>

            {/* Save Profile button */}
            <div className="min-h-[20px]">
              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-green-600">Profile saved!</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveProfile}
                disabled={!canSave}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Security */}
      <section className="p-8 rounded-xl glass-surface">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-bold text-black mb-2">
              Security
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Keep your account secure by updating your password regularly.
            </p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="New Password" type="password" />
                <Input label="Confirm New Password" type="password" />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="primary" size="md">
                Update Security
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Notifications */}
      <section className="p-8 rounded-xl glass-surface">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-bold text-black mb-2">
              Notifications
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Control how BrainRank communicates with you.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle: Analysis Complete */}
            <div className="bg-gray-50 p-5 rounded-xl flex items-start justify-between border border-gray-100">
              <div>
                <p className="text-on-surface font-headline font-medium text-sm mb-1">
                  Analysis Complete
                </p>
                <p className="text-xs text-on-surface-variant">
                  When your content is fully processed.
                </p>
              </div>
              <Toggle
                checked={prefs.analysisComplete}
                onChange={(v) => updatePref("analysisComplete", v)}
              />
            </div>

            {/* Toggle: Processing Failed */}
            <div className="bg-gray-50 p-5 rounded-xl flex items-start justify-between border border-gray-100">
              <div>
                <p className="text-on-surface font-headline font-medium text-sm mb-1">
                  Processing Failed
                </p>
                <p className="text-xs text-on-surface-variant">
                  Urgent alerts for technical interruptions.
                </p>
              </div>
              <Toggle
                checked={prefs.processingFailed}
                onChange={(v) => updatePref("processingFailed", v)}
              />
            </div>

            {/* Toggle: Weekly Summary */}
            <div className="bg-gray-50 p-5 rounded-xl flex items-start justify-between border border-gray-100">
              <div>
                <p className="text-on-surface font-headline font-medium text-sm mb-1">
                  Weekly Summary
                </p>
                <p className="text-xs text-on-surface-variant">
                  A digest of your channel performance.
                </p>
              </div>
              <Toggle
                checked={prefs.weeklySummary}
                onChange={(v) => updatePref("weeklySummary", v)}
              />
            </div>

            {/* Toggle: Product Updates */}
            <div className="bg-gray-50 p-5 rounded-xl flex items-start justify-between border border-gray-100">
              <div>
                <p className="text-on-surface font-headline font-medium text-sm mb-1">
                  Product Updates
                </p>
                <p className="text-xs text-on-surface-variant">
                  New features and neural model releases.
                </p>
              </div>
              <Toggle
                checked={prefs.productUpdates}
                onChange={(v) => updatePref("productUpdates", v)}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
