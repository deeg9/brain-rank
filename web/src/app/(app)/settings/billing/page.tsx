"use client";

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold font-headline mb-2 text-on-surface">
          Billing &amp; Credits
        </h1>
        <p className="text-on-surface-variant max-w-xl">
          Manage your neural processing power and subscription tiers. Credits
          are consumed based on video resolution and analysis depth.
        </p>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-8 rounded-xl flex flex-col gap-1">
          <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
            Current Plan
          </span>
          <span className="text-2xl font-bold font-headline text-primary">
            Pro
          </span>
        </div>
        <div className="bg-surface-container p-8 rounded-xl flex flex-col gap-1">
          <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
            Balance
          </span>
          <span className="text-2xl font-bold font-headline text-on-surface">
            250
          </span>
        </div>
        <div className="bg-surface-container p-8 rounded-xl flex flex-col gap-1">
          <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
            Spent
          </span>
          <span className="text-2xl font-bold font-headline text-on-surface">
            $0
          </span>
        </div>
      </section>

      {/* Purchase Credits */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-bold font-headline text-on-surface">
            Purchase Credits
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Refill your account balance with neural processing units.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Pack */}
          <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center text-center group transition-transform duration-200 hover:scale-[1.02]">
            <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant mb-4">
              Starter Pack
            </span>
            <div className="mb-6">
              <span className="text-4xl font-bold font-headline block">
                100
              </span>
              <span className="text-xs text-on-surface-variant">Credits</span>
            </div>
            <div className="text-xl font-headline mb-8">$9.99</div>
            <button
              onClick={() => alert("Payment processing coming soon!")}
              className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-lg text-sm transition-opacity hover:opacity-80"
            >
              Buy Now
            </button>
          </div>

          {/* Content Creator - Most Popular */}
          <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center text-center relative border border-primary/30 group transition-transform duration-200 hover:scale-[1.02]">
            <div className="absolute -top-3 px-3 py-1 neural-gradient rounded-full text-[9px] font-bold uppercase tracking-widest text-on-surface">
              Most Popular
            </div>
            <span className="font-headline uppercase tracking-widest text-[10px] text-primary mb-4">
              Content Creator
            </span>
            <div className="mb-6">
              <span className="text-4xl font-bold font-headline block">
                500
              </span>
              <span className="text-xs text-on-surface-variant">Credits</span>
            </div>
            <div className="text-xl font-headline mb-8">$39.99</div>
            <button
              onClick={() => alert("Payment processing coming soon!")}
              className="w-full py-3 bg-secondary text-on-secondary-container font-bold rounded-lg text-sm transition-opacity hover:opacity-90"
            >
              Buy Now
            </button>
          </div>

          {/* Agency Tier */}
          <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center text-center group transition-transform duration-200 hover:scale-[1.02]">
            <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant mb-4">
              Agency Tier
            </span>
            <div className="mb-6">
              <span className="text-4xl font-bold font-headline block">
                1000
              </span>
              <span className="text-xs text-on-surface-variant">Credits</span>
            </div>
            <div className="text-xl font-headline mb-8">$69.99</div>
            <button
              onClick={() => alert("Payment processing coming soon!")}
              className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-lg text-sm transition-opacity hover:opacity-80"
            >
              Buy Now
            </button>
          </div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold font-headline text-on-surface">
          Transaction History
        </h3>
        <div className="overflow-hidden rounded-xl bg-surface-container">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/50">
                <th className="px-6 py-4 text-left font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
                  Date
                </th>
                <th className="px-6 py-4 text-left font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
                  Type
                </th>
                <th className="px-6 py-4 text-right font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
                  Amount
                </th>
                <th className="px-6 py-4 text-right font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-on-surface-variant"
                >
                  No transactions yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
