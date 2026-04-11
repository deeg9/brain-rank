export function ActivationLegend() {
  return (
    <div className="flex items-center gap-3 px-2 mt-3">
      <span className="text-xs text-on-surface-variant font-headline">Low</span>
      <div className="flex-1 relative">
        <div
          className="h-3 rounded-full"
          style={{
            background:
              'linear-gradient(to right, #000004 0%, #420a68 20%, #932667 40%, #dd513a 60%, #fca50a 80%, #fcffa4 100%)',
          }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-white/70"
          style={{ left: '30%' }}
        />
        <span
          className="absolute text-[10px] text-on-surface-variant"
          style={{ left: '30%', transform: 'translateX(-50%)', top: '16px' }}
        >
          30%
        </span>
      </div>
      <span className="text-xs text-on-surface-variant font-headline">High</span>
    </div>
  );
}
