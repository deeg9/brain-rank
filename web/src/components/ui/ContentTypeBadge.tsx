import type { InputType } from "@/lib/database.types";

interface ContentTypeBadgeProps {
  inputType: InputType | undefined | null;
  className?: string;
}

const typeConfig: Record<string, { label: string; icon: string; style: string }> = {
  video: { label: "Video", icon: "videocam", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  image: { label: "Image", icon: "image", style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  text_spoken: { label: "Text", icon: "record_voice_over", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  text_visual: { label: "Text", icon: "text_fields", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export function ContentTypeBadge({ inputType, className = "" }: ContentTypeBadgeProps) {
  const type = inputType || "video";
  const config = typeConfig[type] || typeConfig.video;
  const isExploratory = type !== "video";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${config.style}`}
      >
        <span className="material-symbols-outlined text-xs">{config.icon}</span>
        {config.label}
      </span>
      {isExploratory && (
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Exploratory
        </span>
      )}
    </span>
  );
}
