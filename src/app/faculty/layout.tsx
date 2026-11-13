import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { BookOpen, LogOut, User, LayoutDashboard, Edit3 } from "lucide-react";
import Link from "next/link";

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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#0f2042] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c69214] text-white shadow">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white">
                Shri Ram Group of Colleges
              </div>
              <div className="text-xs text-[#dec06b]">
                Faculty Academic Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <User className="h-4 w-4 text-[#dec06b]" />
              <span className="font-semibold text-white">{session.user.identifier}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 px-4">
          <Link
            href="/faculty"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-semibold text-slate-600 transition hover:border-[#0f2042] hover:text-[#0f2042]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Assigned Classes</span>
          </Link>
          <Link
            href="/faculty/marks"
            className="flex items-center gap-2 border-b-2 border-transparent py-3 text-xs font-semibold text-slate-600 transition hover:border-[#0f2042] hover:text-[#0f2042]"
          >
            <Edit3 className="h-4 w-4" />
            <span>Marks Entry & Submission</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

