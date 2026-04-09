import { use } from "react";
import { Card } from "@/components/ui";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ResultsDetailPage({ params }: Props) {
  const { id } = use(params);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Results Detail
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Analysis: {id}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Overall Score
          </p>
          <p className="font-headline text-3xl font-bold text-primary">0.72</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Hook Score
          </p>
          <p className="font-headline text-3xl font-bold text-secondary">
            0.85
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Retention
          </p>
          <p className="font-headline text-3xl font-bold text-tertiary-fixed">
            0.68
          </p>
        </Card>
      </div>
    </div>
  );
}
