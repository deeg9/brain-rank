"use client";

interface ArousalValenceCardsProps {
  arousal: number;
  valence: number;
}

function getColorClass(value: number): string {
  if (value >= 0.6) return "text-primary";
  if (value >= 0.3) return "text-secondary";
  return "text-on-surface-variant";
}

export function ArousalValenceCards({ arousal, valence }: ArousalValenceCardsProps) {
  const arousalPct = Math.round(arousal * 100);
  const valencePct = Math.round(valence * 100);

  return (
    <div className="flex gap-4">
      {/* Arousal Card */}
      <div className="flex-1 bg-surface-container-high p-6 rounded-xl flex justify-between items-start">
        <div>
          <p className="text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-1">
            Viewer Arousal
          </p>
          <h2 className={`text-5xl font-headline font-bold ${getColorClass(arousal)}`}>
            {arousalPct}%
          </h2>
          <span className="text-[10px] font-mono text-on-surface-variant mt-1 block">
            Physiological activation level
          </span>
        </div>
        <span className="material-symbols-outlined text-primary text-3xl">
          trending_up
        </span>
      </div>

      {/* Valence Card */}
      <div className="flex-1 bg-surface-container-high p-6 rounded-xl flex justify-between items-start">
        <div>
          <p className="text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-1">
            Viewer Valence
          </p>
          <h2 className={`text-5xl font-headline font-bold ${getColorClass(valence)}`}>
            {valencePct}%
          </h2>
          <span className="text-[10px] font-mono text-on-surface-variant mt-1 block">
            Emotional positivity
          </span>
        </div>
        <span className="material-symbols-outlined text-primary text-3xl">
          sentiment_satisfied
        </span>
      </div>
    </div>
  );
}
