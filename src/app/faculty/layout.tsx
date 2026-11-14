import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { LogOut, User, LayoutDashboard, Edit3 } from "lucide-react";
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
    <div className="min-h-screen bg-[#faf9f8] text-stone-900 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#2d161c] bg-[#180d10] text-white shadow-xs w-full">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3.5 sm:px-5 md:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#831825] text-white font-semibold text-xs shadow-xs">
              SR
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs sm:text-sm font-semibold tracking-tight text-white leading-tight truncate">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-400 leading-tight">
                Faculty Academic Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-md border border-[#3d1e26] bg-[#241318] px-2.5 py-1 text-xs text-stone-300">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate tabular-nums font-medium text-white">
                {session.user.identifier}
              </span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-[#3d1e26] bg-[#241318] px-2.5 sm:px-3 py-1 text-xs font-medium text-stone-200 transition hover:bg-[#331b22]"
              >
                <LogOut className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-3.5 sm:px-5 md:px-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link
            href="/faculty"
            className="flex items-center gap-2 border-b-2 border-transparent py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#831825] hover:text-[#831825]"
          >
            <LayoutDashboard className="h-4 w-4 text-stone-400" />
            <span>Assigned Classes</span>
          </Link>
          <Link
            href="/faculty/marks"
            className="flex items-center gap-2 border-b-2 border-transparent py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#831825] hover:text-[#831825]"
          >
            <Edit3 className="h-4 w-4 text-stone-400" />
            <span>Marks Entry & Submission</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3.5 sm:px-5 md:px-6 py-4 sm:py-6 w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
