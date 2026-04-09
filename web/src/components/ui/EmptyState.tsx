import React from "react";
import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  headline: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({
  icon,
  headline,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  const ctaButton = ctaLabel ? (
    <Button variant="primary" size="md">
      {ctaLabel}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
          {icon}
        </span>
      )}
      <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
        {headline}
      </h3>
      {description && (
        <p className="text-on-surface-variant text-base max-w-md mb-8">
          {description}
        </p>
      )}
      {ctaButton && ctaHref ? (
        <Link href={ctaHref}>{ctaButton}</Link>
      ) : (
        ctaButton
      )}
    </div>
  );
}
