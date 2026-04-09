"use client";

import { AuthLayout } from "@/components/layout";
import { Button } from "@/components/ui";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthLayout maxWidth="max-w-lg">
      <div className="text-center space-y-6">
        <span className="material-symbols-outlined text-7xl text-error">
          error
        </span>
        <h1 className="font-headline text-5xl font-bold text-on-surface">
          500
        </h1>
        <p className="text-on-surface-variant text-lg">
          Something went wrong in the neural processing
        </p>
        <Button variant="primary" size="md" onClick={reset}>
          Try Again
        </Button>
      </div>
    </AuthLayout>
  );
}
