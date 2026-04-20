"use client";

interface ExportButtonProps {
  data: Record<string, unknown>;
  filename?: string;
}

function stripHeavyFields(data: Record<string, unknown>): Record<string, unknown> {
  const { raw_shape: _raw_shape, segments, ...rest } = data as {
    raw_shape?: unknown;
    segments?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  const cleaned: Record<string, unknown> = { ...rest };
  if (Array.isArray(segments)) {
    cleaned.segments = segments.map((seg) => {
      const { vertex_data: _vertex_data, ...segRest } = seg;
      return segRest;
    });
  }
  return cleaned;
}

export function ExportButton({
  data,
  filename = "brainrank-results.json",
}: ExportButtonProps) {
  function handleExport() {
    const json = JSON.stringify(stripHeavyFields(data), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-headline font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">download</span>
      Export Report
    </button>
  );
}
