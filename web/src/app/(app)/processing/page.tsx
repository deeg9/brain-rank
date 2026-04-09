import { StatusBadge, GlassPanel, Skeleton } from "@/components/ui";

export default function ProcessingPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Neural Processing
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Your video is being analyzed
        </p>
        <div className="mt-4">
          <StatusBadge status="processing" label="Neural analysis in progress" />
        </div>
      </div>

      <GlassPanel>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-headline font-semibold text-on-surface">
              sample_video.mp4
            </p>
            <span className="text-primary font-headline font-bold text-lg">
              42%
            </span>
          </div>
          <div className="w-full bg-surface-container-low rounded-lg h-2">
            <div
              className="neural-gradient h-2 rounded-lg transition-all duration-500"
              style={{ width: "42%" }}
            />
          </div>
          <Skeleton variant="row" count={4} />
        </div>
      </GlassPanel>
    </div>
  );
}
