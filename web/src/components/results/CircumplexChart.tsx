"use client";

interface CircumplexChartProps {
  arousal: number;
  valence: number;
}

export function CircumplexChart({ arousal, valence }: CircumplexChartProps) {
  // Chart area: 40px padding on each side, chart spans 160x160 within 240x240 viewBox
  const pad = 40;
  const size = 160;
  const cx = pad + valence * size;      // valence 0=left, 1=right
  const cy = pad + (1 - arousal) * size; // arousal 0=bottom, 1=top (SVG y-axis inverted)
  const midX = pad + size / 2;
  const midY = pad + size / 2;

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
          neurology
        </span>
        <h4 className="font-headline text-sm font-bold text-on-surface">
          Emotional State
        </h4>
      </div>
      <svg viewBox="0 0 240 240" className="w-full" role="img" aria-label="Arousal-valence circumplex chart">
        {/* Axis lines */}
        <line x1={midX} y1={pad} x2={midX} y2={pad + size} stroke="white" strokeOpacity={0.1} strokeWidth={1} />
        <line x1={pad} y1={midY} x2={pad + size} y2={midY} stroke="white" strokeOpacity={0.1} strokeWidth={1} />

        {/* Quadrant labels */}
        <text x={pad + size - 4} y={pad + 14} textAnchor="end" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="inherit">
          Excited
        </text>
        <text x={pad + 4} y={pad + 14} textAnchor="start" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="inherit">
          Tense
        </text>
        <text x={pad + size - 4} y={pad + size - 6} textAnchor="end" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="inherit">
          Calm
        </text>
        <text x={pad + 4} y={pad + size - 6} textAnchor="start" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="inherit">
          Bored
        </text>

        {/* Axis labels */}
        <text x={midX} y={pad + size + 16} textAnchor="middle" fontSize={9} fill="white" fillOpacity={0.3} fontFamily="inherit">
          Valence
        </text>
        <text
          x={pad - 16}
          y={midY}
          textAnchor="middle"
          fontSize={9}
          fill="white"
          fillOpacity={0.3}
          fontFamily="inherit"
          transform={`rotate(-90, ${pad - 16}, ${midY})`}
        >
          Arousal
        </text>

        {/* Pulsing ring */}
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#a78bfa" strokeWidth={1.5}>
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Data point with glow */}
        <circle cx={cx} cy={cy} r={6} fill="#a78bfa" filter="url(#glow)" />

        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
