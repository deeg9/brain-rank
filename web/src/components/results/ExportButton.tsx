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
      className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-headline font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">download</span>
      Export Report
    </button>
  );
}
