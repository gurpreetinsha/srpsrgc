import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { GraduationCap, LogOut, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.STUDENT && session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-red-800 bg-[#991b1b] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#991b1b] shadow">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[11px] sm:text-xs text-red-200 leading-tight">
                Student Examination Portal
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

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
