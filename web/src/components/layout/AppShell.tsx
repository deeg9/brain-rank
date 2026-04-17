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
      <main className="pt-20 md:pt-24 min-h-screen bg-surface px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </>
  );
}
