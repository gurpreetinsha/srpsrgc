"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Building,
  Users,
  FileCheck2,
  BarChart3,
  History,
  Sliders,
  Menu,
  X,
  User,
} from "lucide-react";

interface AdminLayoutShellProps {
  sessionIdentifier: string;
  children: React.ReactNode;
}

export function AdminLayoutShell({ sessionIdentifier, children }: AdminLayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: "Dashboard and Setup", icon: LayoutDashboard },
    { href: "/admin/academic", label: "Academic Structure", icon: Building },
    { href: "/admin/people", label: "Students and Faculty", icon: Users },
    { href: "/admin/exams", label: "Examinations and Publication", icon: FileCheck2 },
    { href: "/admin/reports", label: "Reports and Analytics", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit Logs", icon: History },
    { href: "/admin/institution", label: "Institution Settings", icon: Sliders },
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#faf9f8] text-stone-900 w-full max-w-full overflow-x-hidden">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#2d161c] bg-[#180d10] px-3.5 py-2.5 text-white shadow-xs lg:hidden w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3d1e26] bg-[#241318] text-stone-200 transition hover:bg-[#331b22] focus:outline-none"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#831825] text-white font-semibold text-xs shadow-xs">
              SR
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs font-semibold text-white leading-tight truncate">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[10px] text-stone-400 leading-tight">Admin Console</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-[#241318] border border-[#3d1e26] px-2 py-1 text-xs text-stone-300">
            <User className="h-3.5 w-3.5 text-stone-400" />
            <span className="max-w-[120px] truncate tabular-nums">{sessionIdentifier}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="flex items-center gap-1 rounded-md border border-[#3d1e26] bg-[#241318] px-2.5 py-1 text-xs font-medium text-stone-200 transition hover:bg-[#331b22]"
            >
              <LogOut className="h-3.5 w-3.5 text-stone-400" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#180d10] text-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#2d161c] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#831825] text-white font-semibold text-xs shadow-xs">
              SR
            </div>
            <div>
              <div className="text-xs font-semibold text-white">SRGC Portal</div>
              <div className="text-[10px] text-stone-400">Administration</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-stone-400 hover:bg-[#241318] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-[#831825] text-white font-medium shadow-xs"
                    : "text-stone-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-stone-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2d161c] p-3">
          <div className="mb-2 text-xs">
            <p className="font-medium text-white truncate tabular-nums">{sessionIdentifier}</p>
            <p className="text-[10px] text-stone-400">System Administrator</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[#3d1e26] bg-[#241318] px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:bg-[#331b22]"
            >
              <LogOut className="h-3.5 w-3.5 text-stone-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#2d161c] lg:bg-[#180d10] lg:text-white">
        <div className="border-b border-[#2d161c] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#831825] text-white font-semibold text-xs shadow-xs">
              SR
            </div>
            <div>
              <div className="text-xs font-semibold text-white tracking-tight">
                Shri Ram Group
              </div>
              <div className="text-[10px] text-stone-400">
                Result Management System
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-[#831825] text-white font-medium shadow-xs"
                    : "text-stone-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-stone-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Footer */}
        <div className="border-t border-[#2d161c] p-3">
          <div className="mb-2 text-xs">
            <p className="font-medium text-white truncate tabular-nums">{sessionIdentifier}</p>
            <p className="text-[10px] text-stone-400">System Administrator</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[#3d1e26] bg-[#241318] px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:bg-[#331b22]"
            >
              <LogOut className="h-3.5 w-3.5 text-stone-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 max-w-full overflow-x-hidden">
        <main className="mx-auto max-w-7xl p-3.5 sm:p-5 md:p-6 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
