import Link from "next/link";
import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = {
  title: "Billing - BrainRank",
  description: "Billing is paused during the research beta.",
};

export default function BillingPage() {
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto pt-10 px-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              science
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Research Beta
            </span>
          </div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            Billing is paused
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            BrainRank is currently operating as a non-commercial research beta.
            All accounts have free access while we evaluate community interest,
            and no fees are being collected. Paid plans are paused and will
            return when we obtain a commercial license for the underlying
            TRIBE v2 model.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            See the{" "}
            <Link
              href="/research-agreement"
              className="text-on-surface font-semibold underline hover:text-on-surface/70 transition-colors"
            >
              Contribution Agreement
            </Link>{" "}
            for details on how your uploads are used during the beta.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
