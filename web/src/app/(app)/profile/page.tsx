import { Card } from "@/components/ui";

export default function ProfilePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
          Profile
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">
          Your account information and stats
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              person
            </span>
          </div>
          <div>
            <p className="font-headline text-xl font-bold text-on-surface">
              User
            </p>
            <p className="text-on-surface-variant text-sm">
              user@neurocut.io
            </p>
            <p className="text-on-surface-variant text-xs mt-1">
              Member since April 2026
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Total Analyses
          </p>
          <p className="font-headline text-3xl font-bold text-on-surface">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Average Score
          </p>
          <p className="font-headline text-3xl font-bold text-on-surface">
            --
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Credits Used
          </p>
          <p className="font-headline text-3xl font-bold text-on-surface">0</p>
        </Card>
      </div>
    </div>
  );
}
