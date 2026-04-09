"use client";

import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function SignupPage() {
  return (
    <div className="bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow">
      <div className="text-center mb-8">
        <h1 className="font-headline font-bold text-4xl text-on-surface">
          Create Account
        </h1>
        <p className="text-on-surface-variant mt-2">
          Start analyzing your content with neural insights
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Input label="Full Name" type="text" placeholder="Your name" />
        <Input label="Email" type="email" placeholder="you@example.com" />
        <Input label="Password" type="password" placeholder="Create a password" />

        <Button variant="primary" size="lg" type="submit">
          Sign Up
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-dim transition-colors font-semibold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
