'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MetricInfoProps {
  title: string;
  description: string;
  calculation: string;
  interpretation: string;
}

export function MetricInfo({ title, description, calculation, interpretation }: MetricInfoProps) {
  const [open, setOpen] = useState(false);
  const [flipDown, setFlipDown] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    // Check if there's enough space above
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // If less than 200px above the icon, flip to below
      setFlipDown(rect.top < 200);
    }
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const positionClasses = flipDown
    ? 'top-full mt-2'
    : 'bottom-full mb-2';

  return (
    <span className="relative inline-block" ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <span
        className="ml-1 text-on-surface/70 hover:text-on-surface transition-colors align-middle cursor-help"
        aria-label={`Info about ${title}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>info</span>
      </span>
      {open && (
        <div
          ref={popoverRef}
          className={`absolute left-1/2 -translate-x-1/2 ${positionClasses} w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-xl z-50 normal-case tracking-normal text-left font-normal`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p className="font-headline text-sm font-black text-black mb-2">{title}</p>
          <p className="text-[12px] text-gray-700 mb-3 leading-relaxed">{description}</p>
          <p className="text-[12px] text-gray-700 mb-2 leading-relaxed">
            <span className="font-bold text-black">How it&apos;s calculated:</span> {calculation}
          </p>
          <p className="text-[12px] text-gray-700 leading-relaxed">
            <span className="font-bold text-black">How to interpret:</span> {interpretation}
          </p>
        </div>
      )}
    </span>
  );
}
