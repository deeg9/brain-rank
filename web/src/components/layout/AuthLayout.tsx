interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export function AuthLayout({
  children,
  maxWidth = "max-w-[420px]",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative">
      {/* Decorative neural gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full neural-gradient blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full bg-secondary blur-[100px] opacity-30" />
      </div>

      {/* Branding anchor + children */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 neural-gradient rounded-xl mb-4 flex items-center justify-center ambient-glow">
            <span className="material-symbols-outlined text-on-surface text-3xl">
              psychology
            </span>
          </div>
          <h2 className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface">
            NeuroCut
          </h2>
        </div>
        <main className={`w-full ${maxWidth}`}>{children}</main>
      </div>
    </div>
  );
}
