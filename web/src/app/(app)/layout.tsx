import { AppShell } from "@/components/layout";
import { OfflineDetector } from "@/components/OfflineDetector";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <OfflineDetector />
    </AppShell>
  );
}
