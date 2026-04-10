"use client";

interface ExportButtonProps {
  data: Record<string, unknown>;
  filename?: string;
}

export function ExportButton({
  data,
  filename = "neurocut-results.json",
}: ExportButtonProps) {
  function handleExport() {
    const json = JSON.stringify(data, null, 2);
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
      className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-[10px] font-headline uppercase tracking-widest ghost-border hover:opacity-80 transition-opacity flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">download</span>
      Export JSON
    </button>
  );
}
