import { Button, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
            Analysis History
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            Review your past neural analyses
          </p>
        </div>
        <Button variant="primary" size="md">
          New Analysis
        </Button>
      </div>
      <EmptyState
        icon="psychology"
        headline="No analyses yet"
        description="Upload your first video to see neural activation insights"
        ctaLabel="New Analysis"
        ctaHref="/upload"
      />
    </div>
  );
}
