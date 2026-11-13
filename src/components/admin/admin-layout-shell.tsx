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
    { href: "/admin", label: "Dashboard & Setup", icon: LayoutDashboard },
    { href: "/admin/academic", label: "Academic Structure", icon: Building },
    { href: "/admin/people", label: "Students & Faculty", icon: Users },
    { href: "/admin/exams", label: "Examinations & Publication", icon: FileCheck2 },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit Logs", icon: History },
    { href: "/admin/institution", label: "Institution Settings", icon: Sliders },
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-red-800 bg-[#991b1b] px-4 py-3 text-white shadow-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-700 bg-red-900/60 text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#991b1b] shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight">
                SRGC Results
              </div>
              <div className="text-[10px] text-red-200 leading-tight">Admin Console</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-red-900/80 px-2.5 py-1 text-xs text-red-100">
            <User className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{sessionIdentifier}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign Out"
              className="flex items-center gap-1 rounded-lg border border-red-700 bg-red-900/80 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#7f1d1d] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-red-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#991b1b] shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">SRGC Portal</div>
              <div className="text-[11px] text-red-200">Administration</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-red-200 hover:bg-red-800 hover:text-white"
          >
            <X className="h-5 w-5" />
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-[#991b1b] shadow-sm font-bold"
                    : "text-red-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#991b1b]" : "text-red-200"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-red-800/80 p-4">
          <div className="mb-3 text-xs">
            <p className="font-semibold text-white truncate">{sessionIdentifier}</p>
            <p className="text-[10px] text-red-200">System Administrator</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-900/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-red-900 lg:bg-[#991b1b] lg:text-white">
        <div className="border-b border-red-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#991b1b] shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">
                SRGC Result System
              </div>
              <div className="text-[11px] text-red-200">
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-[#991b1b] shadow-sm font-bold"
                    : "text-red-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#991b1b]" : "text-red-200"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Footer */}
        <div className="border-t border-red-800 p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-semibold text-white">{sessionIdentifier}</p>
              <p className="text-[10px] text-red-200">System Administrator</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-900/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
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

