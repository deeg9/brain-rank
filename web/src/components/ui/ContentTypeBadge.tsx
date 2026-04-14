import type { InputType } from "@/lib/database.types";

interface ContentTypeBadgeProps {
  inputType: InputType | undefined | null;
  className?: string;
}

const typeConfig: Record<string, { label: string; icon: string }> = {
  video: { label: "Video", icon: "videocam" },
  image: { label: "Image", icon: "image" },
  text: { label: "Text", icon: "text_fields" },
  text_spoken: { label: "Text", icon: "text_fields" },
  text_visual: { label: "Text", icon: "text_fields" },
};

export function ContentTypeBadge({ inputType, className = "" }: ContentTypeBadgeProps) {
  const type = inputType || "video";
  const config = typeConfig[type] || typeConfig.video;
  const isExploratory = type !== "video";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold text-black ${className}`}>
      <span className="material-symbols-outlined text-sm">{config.icon}</span>
      <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{config.label}</span>
    </span>
  );
}
