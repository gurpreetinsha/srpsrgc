import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { GraduationCap, LogOut, User } from "lucide-react";

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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#0f2042] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c69214] text-white shadow">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white">
                Shri Ram Group of Colleges
              </div>
              <div className="text-xs text-[#dec06b]">
                Student Examination Portal
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

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
