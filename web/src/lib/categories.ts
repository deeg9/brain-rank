export const CONTENT_CATEGORIES = [
  { value: "comedy", label: "Comedy / Entertainment" },
  { value: "education", label: "Education / How-To" },
  { value: "fitness", label: "Fitness / Sports" },
  { value: "music", label: "Music / Performance" },
  { value: "food", label: "Food / Cooking" },
  { value: "travel", label: "Travel / Outdoors" },
  { value: "tech", label: "Tech / Reviews" },
  { value: "beauty", label: "Beauty / Fashion" },
  { value: "gaming", label: "Gaming" },
  { value: "news", label: "News / Commentary" },
  { value: "asmr", label: "ASMR / Relaxation" },
  { value: "vlog", label: "Vlog / Lifestyle" },
  { value: "horror", label: "Horror / Thriller" },
  { value: "other", label: "Other" },
] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number]["value"];
