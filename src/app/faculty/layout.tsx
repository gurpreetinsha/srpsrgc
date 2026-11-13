import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { BookOpen, LogOut, User, LayoutDashboard, Edit3 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.FACULTY && session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0b1727] text-white shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white leading-tight">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Faculty Academic Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate tabular-nums font-medium text-white">
                {session.user.identifier}
              </span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 px-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link
            href="/faculty"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-medium text-slate-600 transition hover:border-slate-800 hover:text-slate-900"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span>Assigned Classes</span>
          </Link>
          <Link
            href="/faculty/marks"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-medium text-slate-600 transition hover:border-slate-800 hover:text-slate-900"
          >
            <Edit3 className="h-4 w-4 text-slate-400" />
            <span>Marks Entry and Submission</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
