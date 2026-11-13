import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Building,
  Users,
  FileCheck2,
  BarChart3,
  History,
  Sliders,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard & Setup", icon: LayoutDashboard },
    { href: "/admin/academic", label: "Academic Structure", icon: Building },
    { href: "/admin/people", label: "Students & Faculty", icon: Users },
    { href: "/admin/exams", label: "Examinations & Publication", icon: FileCheck2 },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit Logs", icon: History },
    { href: "/admin/institution", label: "Institution Settings", icon: Sliders },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-[#0f2042] text-white">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c69214] text-white shadow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">
                SRGC Result System
              </div>
              <div className="text-[11px] text-[#dec06b]">
                Administration Console
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4 text-[#dec06b]" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-semibold text-white">{session.user.identifier}</p>
              <p className="text-[10px] text-slate-400">System Administrator</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-6xl p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

