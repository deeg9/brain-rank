"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "neural-gradient text-on-surface font-headline font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20",
  secondary:
    "bg-surface-container-highest text-on-surface font-semibold rounded-lg hover:bg-surface-bright transition-colors ghost-border",
  ghost:
    "text-on-surface-variant hover:text-on-surface transition-colors",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-4 text-base w-full",
};

const disabledStyles =
  "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-60";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const classes = isDisabled
    ? `${disabledStyles} ${sizeStyles[size]} rounded-lg font-headline font-bold`
    : `${variantStyles[variant]} ${sizeStyles[size]}`;

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${classes} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {loading ? "Loading..." : children}
    </button>
  );
}
