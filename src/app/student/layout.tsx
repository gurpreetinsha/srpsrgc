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
    <div className="min-h-screen bg-[#faf9f8] text-stone-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#2d161c] bg-[#180d10] text-white shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3.5 sm:px-5 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#241216] border border-[#3d1c24] text-stone-100 shadow-xs">
              <GraduationCap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white leading-tight">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[11px] text-stone-400 leading-tight">
                Student Examination Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-[#331a20] bg-[#221115] px-2.5 py-1 text-xs text-stone-300">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate tabular-nums font-medium text-white">
                {session.user.identifier}
              </span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-[#331a20] bg-[#221115] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:bg-[#2d161c] hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-3.5 sm:px-5 md:px-6 py-4 sm:py-6 flex-1 min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
