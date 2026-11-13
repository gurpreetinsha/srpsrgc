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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-red-800 bg-[#991b1b] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#991b1b] shadow">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[11px] sm:text-xs text-red-200 leading-tight">
                Faculty Academic Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 rounded-full bg-red-900/70 px-2.5 py-1 text-xs text-red-100">
              <User className="h-3.5 w-3.5 text-white" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate font-semibold text-white">
                {session.user.identifier}
              </span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-red-700 bg-red-900/80 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar (Mobile Scrollable) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-4 sm:gap-6 px-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link
            href="/faculty"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-semibold text-slate-700 transition hover:border-[#991b1b] hover:text-[#991b1b]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Assigned Classes</span>
          </Link>
          <Link
            href="/faculty/marks"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-semibold text-slate-700 transition hover:border-[#991b1b] hover:text-[#991b1b]"
          >
            <Edit3 className="h-4 w-4" />
            <span>Marks Entry & Submission</span>
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
