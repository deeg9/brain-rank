"use client";

import { useState } from "react";

export function AnalysisSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative w-56">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
        search
      </span>
      <input
        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all"
        placeholder="Search analyses..."
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
