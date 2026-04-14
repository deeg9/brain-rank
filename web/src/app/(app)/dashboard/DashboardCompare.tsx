"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ComparisonTray } from "@/components/compare/ComparisonTray";

const ComparisonModal = dynamic(
  () => import("@/components/compare/ComparisonModal").then(m => m.ComparisonModal),
  { ssr: false }
);

interface CompareItem {
  id: string;
  title: string;
  video_url: string;
}

interface DashboardCompareProps {
  children: (props: {
    compareA: CompareItem | null;
    compareB: CompareItem | null;
    handleCompareSelect: (item: CompareItem) => void;
  }) => React.ReactNode;
}

export function DashboardCompare({ children }: DashboardCompareProps) {
  const [compareA, setCompareA] = useState<CompareItem | null>(null);
  const [compareB, setCompareB] = useState<CompareItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleCompareSelect = useCallback((item: CompareItem) => {
    if (compareA?.id === item.id) {
      setCompareA(null);
      return;
    }
    if (compareB?.id === item.id) {
      setCompareB(null);
      return;
    }
    if (!compareA) {
      setCompareA(item);
    } else if (!compareB) {
      setCompareB(item);
    } else {
      setCompareB(item);
    }
  }, [compareA, compareB]);

  return (
    <>
      {children({ compareA, compareB, handleCompareSelect })}

      {(compareA || compareB) && <div className="h-20" />}

      <ComparisonTray
        slotA={compareA ? { id: compareA.id, title: compareA.title, video_url: compareA.video_url, overall_score: null, created_at: '', creator_username: null, creator_avatar_url: null } : null}
        slotB={compareB ? { id: compareB.id, title: compareB.title, video_url: compareB.video_url, overall_score: null, created_at: '', creator_username: null, creator_avatar_url: null } : null}
        onRemoveA={() => setCompareA(null)}
        onRemoveB={() => setCompareB(null)}
        onCompare={() => setShowModal(true)}
      />

      {compareA && compareB && (
        <ComparisonModal
          jobIdA={compareA.id}
          jobIdB={compareB.id}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
