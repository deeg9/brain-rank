import { AuthLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <AuthLayout maxWidth="max-w-lg">
      <div className="text-center space-y-6">
        <span className="material-symbols-outlined text-7xl text-on-surface-variant">
          explore_off
        </span>
        <h1 className="font-headline text-5xl font-bold text-on-surface">
          404
        </h1>
        <p className="text-on-surface-variant text-lg">
          This page doesn&apos;t exist in the neural network
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="md">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
