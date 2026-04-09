import { Button } from "@/components/ui";

export default function UploadPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Upload Analysis
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Drag and drop your video file to begin neural analysis
        </p>
      </div>

      <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-20 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
          cloud_upload
        </span>
        <p className="text-on-surface-variant text-lg mb-2">
          Drag and drop your video here
        </p>
        <p className="text-on-surface-variant/60 text-sm mb-6">
          MP4, MOV, or AVI up to 500MB
        </p>
        <Button variant="secondary" size="md">
          Browse Files
        </Button>
      </div>
    </div>
  );
}
