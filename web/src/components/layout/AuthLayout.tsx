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
      {/* Full background logo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src="/illustrations/logo-icon.png"
          alt=""
          className="w-[80vmin] h-[80vmin] object-contain opacity-[0.04]"
        />
      </div>

      {/* Branding anchor + children */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/illustrations/logo-icon.png"
            alt="NeuroCut"
            className="w-14 h-14 mb-4"
          />
          <h2 className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface">
            NeuroCut V1
          </h2>
        </div>
        <main className={`w-full ${maxWidth}`}>{children}</main>
      </div>
    </div>
  );
}
