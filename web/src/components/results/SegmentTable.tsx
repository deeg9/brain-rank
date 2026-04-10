"use client";

export interface SegmentRegionScores {
  attention: number;
  reward: number;
  emotional_processing: number;
  social_cognition: number;
  visual_processing: number;
  auditory_processing: number;
  language_narrative: number;
  default_mode: number;
  motion_processing: number;
}

export interface SegmentData {
  start: number;
  end: number;
  activation_score: number;
  arousal: number;
  valence: number;
  regions: SegmentRegionScores;
  vertex_data?: string;
}

interface SegmentTableProps {
  segments: SegmentData[];
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frac = Math.round((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(frac).padStart(2, "0")}`;
}

function getTopRegion(regions: SegmentRegionScores): {
  name: string;
  color: string;
} {
  const entries: { name: string; value: number; color: string }[] = [
    { name: "Attention", value: regions.attention, color: "bg-primary/10 text-primary" },
    { name: "Reward", value: regions.reward, color: "bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim" },
    { name: "Emotional", value: regions.emotional_processing, color: "bg-secondary/10 text-secondary" },
    { name: "Social", value: regions.social_cognition, color: "bg-on-surface-variant/10 text-on-surface-variant" },
    { name: "Visual", value: regions.visual_processing, color: "bg-green-500/10 text-green-400" },
    { name: "Auditory", value: regions.auditory_processing, color: "bg-orange-500/10 text-orange-400" },
    { name: "Language", value: regions.language_narrative, color: "bg-cyan-500/10 text-cyan-400" },
    { name: "Default Mode", value: regions.default_mode, color: "bg-rose-500/10 text-rose-400" },
    { name: "Motion", value: regions.motion_processing, color: "bg-lime-500/10 text-lime-400" },
  ];
  const top = entries.reduce((a, b) => (b.value > a.value ? b : a));
  return { name: top.name, color: top.color };
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return "bg-primary";
  if (score >= 0.4) return "bg-secondary";
  return "bg-error";
}

export function SegmentTable({ segments }: SegmentTableProps) {
  return (
    <div className="bg-surface-container-high rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-headline text-lg font-bold">Segment Explorer</h3>
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
          {segments.length} segments
        </span>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-left text-sm font-body">
          <thead className="bg-surface-container-highest/50 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant sticky top-0">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Activation</th>
              <th className="px-6 py-4 font-semibold">Arousal</th>
              <th className="px-6 py-4 font-semibold">Valence</th>
              <th className="px-6 py-4 font-semibold">Top Region</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {segments.map((seg, i) => {
              const topRegion = getTopRegion(seg.regions);
              const scoreColor = getScoreColor(seg.activation_score);
              const rowBg =
                i % 2 === 0
                  ? "bg-surface-container-low/30"
                  : "bg-surface-container";

              return (
                <tr
                  key={`${seg.start}-${seg.end}`}
                  className={`${rowBg} hover:bg-surface-bright transition-colors cursor-pointer`}
                >
                  <td className="px-6 py-5 font-headline font-bold">
                    {formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full ${scoreColor}`}
                          style={{
                            width: `${Math.round(seg.activation_score * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-headline font-bold">
                        {(seg.activation_score * 10).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 tabular-nums">
                    {seg.arousal.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 tabular-nums">
                    {seg.valence.toFixed(2)}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${topRegion.color}`}
                    >
                      {topRegion.name}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
