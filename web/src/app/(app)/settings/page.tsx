import { Card } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Settings
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Manage your account preferences
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline font-semibold text-on-surface">
                Email Notifications
              </p>
              <p className="text-on-surface-variant text-sm mt-1">
                Receive updates when analyses complete
              </p>
            </div>
            <div className="w-12 h-7 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-5 h-5 bg-on-surface rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline font-semibold text-on-surface">
                Dark Mode
              </p>
              <p className="text-on-surface-variant text-sm mt-1">
                Always enabled in Neural Architect theme
              </p>
            </div>
            <div className="w-12 h-7 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-5 h-5 bg-on-surface rounded-full" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
