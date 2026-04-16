'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface MetricInfoProps {
  title: string;
  description: string;
  calculation: string;
  interpretation: string;
}

const POPOVER_WIDTH = 256;
const POPOVER_OFFSET = 8;
const VIEWPORT_PADDING = 8;

export function MetricInfo({ title, description, calculation, interpretation }: MetricInfoProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computeCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current?.offsetHeight ?? 0;

    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const spaceAbove = trigger.top - VIEWPORT_PADDING;
    const spaceBelow = vh - trigger.bottom - VIEWPORT_PADDING;

    // Decide side. If we don't have a measured height yet, default to whichever
    // side has more space (prevents the first-render flash from flying off-screen).
    // After the popover mounts and we have its real height, prefer the side where
    // it actually fits; fall back to the roomier side.
    let placeBelow: boolean;
    if (popoverHeight === 0) {
      placeBelow = spaceBelow >= spaceAbove;
    } else if (popoverHeight + POPOVER_OFFSET <= spaceBelow) {
      placeBelow = true;
    } else if (popoverHeight + POPOVER_OFFSET <= spaceAbove) {
      placeBelow = false;
    } else {
      placeBelow = spaceBelow >= spaceAbove;
    }

    // Vertical position: start at the natural side, then clamp to viewport so a
    // too-tall popover stays fully on screen (it will overlap the trigger in
    // extreme cases, which is the least-bad outcome).
    let top = placeBelow
      ? trigger.bottom + POPOVER_OFFSET
      : trigger.top - POPOVER_OFFSET - popoverHeight;

    if (popoverHeight > 0) {
      const maxTop = vh - popoverHeight - VIEWPORT_PADDING;
      top = Math.min(Math.max(top, VIEWPORT_PADDING), Math.max(VIEWPORT_PADDING, maxTop));
    }

    // Horizontal: center on trigger, clamp to viewport.
    const centerX = trigger.left + trigger.width / 2;
    let left = centerX - POPOVER_WIDTH / 2;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - POPOVER_WIDTH - VIEWPORT_PADDING));

    setCoords({ top, left });
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    computeCoords();
    setOpen(true);
  }, [computeCoords]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // After the popover mounts, measure its actual height and recompute position.
  // This is what flips the popover to the correct side once we know its size.
  useLayoutEffect(() => {
    if (!open) return;
    computeCoords();
  }, [open, computeCoords]);

  // Reposition on scroll/resize while open so the popover follows the trigger.
  useEffect(() => {
    if (!open) return;
    const onReposition = () => computeCoords();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open, computeCoords]);

  return (
    <span className="relative inline-block" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <span
        className="ml-1 text-on-surface/70 hover:text-on-surface transition-colors align-middle cursor-help"
        aria-label={`Info about ${title}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>info</span>
      </span>
      {mounted && open && coords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
            maxHeight: `calc(100vh - ${VIEWPORT_PADDING * 2}px)`,
            overflowY: 'auto',
            zIndex: 9999,
          }}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-xl normal-case tracking-normal text-left font-normal"
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
        </div>,
        document.body
      )}
    </span>
  );
}
