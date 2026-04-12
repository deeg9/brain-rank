"use client";

interface DurationSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function DurationSlider({ value, onChange, disabled = false }: DurationSliderProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-on-surface">
          Hold Duration
        </label>
        <span className="text-sm font-headline font-bold text-on-surface tabular-nums">
          {value}s
        </span>
      </div>
      <input
        type="range"
        min={2}
        max={15}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-primary-dim cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>2s</span>
        <span>15s</span>
      </div>
    </div>
  );
}
