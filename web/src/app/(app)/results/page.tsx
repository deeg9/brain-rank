import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function ResultsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Results
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Select an analysis to view results
        </p>
      </div>

      <Card hover className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-headline font-semibold text-on-surface">
              Demo Analysis
            </p>
            <p className="text-on-surface-variant text-sm mt-1">
              View a sample neural analysis result
            </p>
          </div>
          <Link href="/results/demo">
            <Button variant="secondary" size="sm">
              View Results
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
