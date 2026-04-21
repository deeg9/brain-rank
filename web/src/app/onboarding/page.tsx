"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resizeToAvatar, uploadAvatar } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_VERSION } from "@/lib/consent";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);

  // UI state
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? "");
    });
  }, [router]);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
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
  }, [username]);

  // Avatar file selection
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    try {
      const resizedBlob = await resizeToAvatar(file);
      setPendingAvatarBlob(resizedBlob);
      setAvatarPreviewUrl(URL.createObjectURL(resizedBlob));
    } catch {
      setError("Failed to process image");
    }
  }

  // Submit onboarding
  async function handleSubmit() {
    if (!userId || username.length < 3) return;
    if (availability && !availability.available) return;

    setSaving(true);
    setError(null);

    try {
      // Upload avatar if pending
      let finalAvatarUrl = avatarUrl;
      if (pendingAvatarBlob) {
        setAvatarUploading(true);
        finalAvatarUrl = await uploadAvatar(pendingAvatarBlob, userId);
        setAvatarUploading(false);
      }

      // Save profile (includes one-time Contribution Agreement consent).
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          consent_version_accepted: CONSENT_VERSION,
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          ...(finalAvatarUrl ? { avatar_url: finalAvatarUrl } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      // Clean up preview
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  const isUsernameValid =
    username.length >= 3 &&
    !checking &&
    (availability === null || availability.available);
  const canSubmit = isUsernameValid && consentAccepted;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 md:p-6 relative">
      {/* Background logo watermark */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src="/illustrations/logo-icon.png"
          alt=""
          className="w-[80vmin] h-[80vmin] object-contain opacity-[0.04]"
        />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <span className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface">
            BRAIN<span className="text-on-surface-variant/40 mx-0.5">|</span>RANK
          </span>
        </div>

        {/* Onboarding card */}
        <main className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            <div className="text-center space-y-2">
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                Set up your profile
              </h1>
              <p className="text-sm text-on-surface-variant">
                Claim your username to get your public profile.
              </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden group transition-all hover:ring-2 hover:ring-black/10"
              >
                {avatarPreviewUrl || avatarUrl ? (
                  <img
                    src={avatarPreviewUrl || avatarUrl!}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                    person
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                    photo_camera
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-on-surface-variant mt-2">
                Optional
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  maxLength={20}
                  placeholder="yourname"
                  className="w-full pl-8 pr-10 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-medium focus:outline-none focus:border-black/30 transition-colors"
                />
                {checking && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant animate-spin text-lg">
                    progress_activity
                  </span>
                )}
                {!checking && availability?.available && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-green-600 text-lg">
                    check_circle
                  </span>
                )}
                {!checking && availability && !availability.available && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-red-500 text-lg">
                    cancel
                  </span>
                )}
              </div>
              {availability && !availability.available && (
                <p className="text-xs text-red-500">{availability.reason}</p>
              )}
              {username.length > 0 && username.length < 3 && (
                <p className="text-xs text-on-surface-variant">
                  Must be at least 3 characters
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Bio
                </label>
                <span className="text-xs text-on-surface-variant/60">Optional</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                maxLength={160}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-medium resize-none focus:outline-none focus:border-black/30 transition-colors"
              />
              <p
                className={`text-xs text-right ${
                  bio.length >= 150
                    ? "text-red-400"
                    : "text-on-surface-variant"
                }`}
              >
                {bio.length}/160
              </p>
            </div>

            {/* Contribution Agreement consent — one-time, replaces per-upload prompt */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-outline-variant/10">
              <div className="relative mt-3 shrink-0">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded bg-surface-container-lowest border border-outline-variant/30 peer-checked:bg-black peer-checked:border-black transition-colors duration-200 flex items-center justify-center">
                  {consentAccepted && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-on-surface-variant leading-snug pt-2">
                I agree to the{" "}
                <Link
                  href="/research-agreement"
                  target="_blank"
                  className="text-on-surface font-semibold underline hover:text-on-surface/70 transition-colors"
                >
                  Contribution Agreement
                </Link>{" "}
                for this non-commercial research beta. Applies to every upload
                from this account — you won&apos;t be asked again.
              </span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  {avatarUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Ready"
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
