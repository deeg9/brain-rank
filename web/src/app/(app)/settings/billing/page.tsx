import { Button, Card } from "@/components/ui";

export default function BillingPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Billing & Credits
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Manage your subscription and credits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Current Plan
          </p>
          <p className="font-headline text-2xl font-bold text-on-surface">
            Pro Plan
          </p>
          <p className="text-on-surface-variant text-sm mt-2">
            Unlimited analyses, priority GPU access
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Credits Remaining
          </p>
          <p className="font-headline text-2xl font-bold text-tertiary-fixed">
            250
          </p>
          <p className="text-on-surface-variant text-sm mt-2">
            ~25 video analyses remaining
          </p>
        </Card>
      </div>

      <Button variant="primary" size="md">
        Upgrade Plan
      </Button>
    </div>
  );
}
