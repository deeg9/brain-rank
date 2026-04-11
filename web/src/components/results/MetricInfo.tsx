'use client';

import { useState, useRef, useEffect } from 'react';

interface MetricInfoProps {
  title: string;
  description: string;
  calculation: string;
  interpretation: string;
}

export function MetricInfo({ title, description, calculation, interpretation }: MetricInfoProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="ml-1 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors align-middle"
        aria-label={`Info about ${title}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-xl z-50">
          <p className="font-headline text-xs font-bold text-on-surface mb-2">{title}</p>
          <p className="text-[11px] text-on-surface-variant mb-2">{description}</p>
          <p className="text-[10px] text-on-surface-variant mb-1">
            <span className="font-bold text-on-surface">How it&apos;s calculated:</span> {calculation}
          </p>
          <p className="text-[10px] text-on-surface-variant">
            <span className="font-bold text-on-surface">How to interpret:</span> {interpretation}
          </p>
        </div>
      )}
    </span>
  );
}
