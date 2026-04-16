import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
        <Link
          href="/"
          className="font-headline font-black text-lg tracking-widest uppercase text-black"
        >
          BRAIN<span className="text-black/30 mx-0.5">|</span>RANK
        </Link>
        {user ? (
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to app
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-black transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 w-full px-8 py-6">{children}</main>
    </div>
  );
}
