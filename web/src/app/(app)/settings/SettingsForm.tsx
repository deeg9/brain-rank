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
        checked ? "bg-tertiary-container" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "bg-on-tertiary-container" : "bg-on-surface-variant"
        }`}
      />
    </button>
  );
}

interface SettingsFormProps {
  email: string;
  displayName: string;
}

export function SettingsForm({ email, displayName }: SettingsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);

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
      <section className="bg-surface-container p-8 rounded-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">
              Profile Information
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Update your public identity and account contact details.
            </p>
          </div>
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">
                Display Name
              </label>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:bg-surface-container focus:ring-0 ghost-border transition-all"
                type="text"
                defaultValue={displayName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">
                Email Address
              </label>
              <div className="flex items-center bg-surface-container-lowest/50 rounded-lg px-4 py-3 text-on-surface-variant cursor-not-allowed">
                <span className="flex-1">{email}</span>
                <span className="material-symbols-outlined text-sm">lock</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/60 italic">
                Email cannot be changed.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="md">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Security */}
      <section className="bg-surface-container p-8 rounded-xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">
              Security
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Ensure your neural engine stays private with a robust password.
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
              <Button variant="secondary" size="md">
                Update Security
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Notifications */}
      <section className="bg-surface-container p-8 rounded-xl">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">
              Notifications
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Control how the Neural Engine communicates with you.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle: Analysis Complete */}
            <div className="bg-surface-container-high p-5 rounded-xl flex items-start justify-between">
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
            <div className="bg-surface-container-high p-5 rounded-xl flex items-start justify-between">
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
            <div className="bg-surface-container-high p-5 rounded-xl flex items-start justify-between">
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
            <div className="bg-surface-container-high p-5 rounded-xl flex items-start justify-between">
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
