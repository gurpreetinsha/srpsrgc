"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#0b1727] px-4 py-3 text-white shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white leading-tight">
                SRGC Result System
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">Admin Console</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-slate-800/80 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[120px] truncate tabular-nums">{sessionIdentifier}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#0b1727] text-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">SRGC Portal</div>
              <div className="text-[11px] text-slate-400">Administration</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-medium border-l-2 border-amber-500"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 text-xs">
            <p className="font-medium text-white truncate tabular-nums">{sessionIdentifier}</p>
            <p className="text-[11px] text-slate-400">System Administrator</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-800 lg:bg-[#0b1727] lg:text-white">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-amber-400 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">
                SRGC Result System
              </div>
              <div className="text-[11px] text-slate-400">
                Administration Console
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-medium border-l-2 border-amber-500"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 text-xs">
            <p className="font-medium text-white truncate tabular-nums">{sessionIdentifier}</p>
            <p className="text-[11px] text-slate-400">System Administrator</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
