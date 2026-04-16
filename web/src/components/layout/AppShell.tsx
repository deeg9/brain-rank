import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
  topBarProps?: {
    title?: string;
    showSearch?: boolean;
    showBackArrow?: boolean;
    backHref?: string;
    rightActions?: React.ReactNode;
  };
}

export function AppShell({ children, topBarProps }: AppShellProps) {
  return (
    <>
      <TopBar {...topBarProps} />
      <main className="pt-16 min-h-screen bg-surface p-4 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </>
  );
}
