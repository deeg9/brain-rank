"use client";

import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow">
      <div className="text-center mb-8">
        <h1 className="font-headline font-bold text-4xl text-on-surface">
          Welcome back
        </h1>
        <p className="text-on-surface-variant mt-2">
          Sign in to your account to continue
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Input label="Email" type="email" placeholder="you@example.com" />
        <Input label="Password" type="password" placeholder="Enter your password" />

        <Button variant="primary" size="lg" type="submit">
          <span>Sign In</span>
          <span className="material-symbols-outlined text-lg">
            arrow_forward
          </span>
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary hover:text-primary-dim transition-colors font-semibold"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
