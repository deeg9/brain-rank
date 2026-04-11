"use client";

import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";

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
}

export function SettingsForm({ email, displayName, currentUsername }: SettingsFormProps) {
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

  async function handleSaveUsername() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save username");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Failed to save username");
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
                {saveError && (
                  <p className="text-xs text-red-500">{saveError}</p>
                )}
                {saveSuccess && (
                  <p className="text-xs text-green-600">Username saved!</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveUsername}
                  disabled={
                    saving ||
                    checking ||
                    username.length < 3 ||
                    (availability !== null && !availability.available) ||
                    username === currentUsername
                  }
                >
                  {saving ? "Saving..." : "Save Username"}
                </Button>
              </div>
            </div>

            {/* TODO: Display Name editing — wire to /api/profile when backend supports it */}
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
              Control how NeuroCut communicates with you.
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
