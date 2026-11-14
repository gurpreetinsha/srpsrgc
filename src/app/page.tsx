import Link from "next/link";
import {
  GraduationCap,
  Lock,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Building2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf9f8] text-stone-900 flex flex-col justify-between">
      {/* Top Quiet Navigation */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#831825] text-amber-300 font-semibold text-sm shadow-xs">
              SR
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-stone-950 leading-tight">
                Shri Ram Group of Colleges
              </div>
              <div className="text-[11px] text-stone-500 leading-tight">
                Examination and Result Management System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#831825] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#6d1521] shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#831825]"
            >
              <span>Portal Sign in</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#831825]" />
                <span className="font-medium text-stone-800">Examination Ordinance 2025–26</span>
                <span className="text-stone-300">•</span>
                <span>NEP-2020 Compliant</span>
              </div>

              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-stone-950 leading-tight">
                  Academic Result and Examination Portal
                </h1>
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                  Centralized institutional evaluation, marks moderation, SGPA and CGPA computation, and verifiable grade card issuance for Shri Ram Group of Colleges.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#831825] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#6d1521] shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#831825]"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-300" />
                  <span>Sign in to Portal</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-900 shadow-2xs"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-stone-500" />
                  <span>Student Result Access</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Authentic Grade Card Preview */}
            <div className="lg:col-span-6 min-w-0 max-w-full">
              <div className="relative rounded-xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs max-w-full overflow-hidden">
                {/* Product Header */}
                <div className="flex items-start justify-between border-b border-stone-100 pb-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-[#831825] uppercase tracking-wide">
                        Verified Grade Record
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>Published</span>
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-stone-900 truncate">
                      Bachelor of Technology (Computer Science)
                    </div>
                    <div className="text-xs text-stone-500">
                      Semester IV Examination • Academic Session 2025–26
                    </div>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700">
                    <QrCode className="h-5 w-5 text-stone-700" />
                  </div>
                </div>

                {/* Candidate Meta Info */}
                <div className="grid grid-cols-3 gap-2 py-3 text-xs border-b border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500">Roll Number</span>
                    <p className="font-medium text-stone-900 tabular-nums">2301048</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500">Student Name</span>
                    <p className="font-medium text-stone-900">Aarav Sharma</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500">College Code</span>
                    <p className="font-medium text-stone-900 tabular-nums">SRGC-082</p>
                  </div>
                </div>

                {/* Course Marks Table with Responsive Scroll */}
                <div className="py-2.5 w-full max-w-full overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[340px]">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-500 font-medium text-[11px]">
                        <th className="pb-1.5">Course Subject</th>
                        <th className="pb-1.5 text-center">Credits</th>
                        <th className="pb-1.5 text-center">Marks</th>
                        <th className="pb-1.5 text-center">Grade</th>
                        <th className="pb-1.5 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      <tr>
                        <td className="py-1.5">
                          <div className="font-medium text-stone-900">Database Management Systems</div>
                          <div className="text-[10px] text-stone-500">CS401</div>
                        </td>
                        <td className="py-1.5 text-center tabular-nums">4.0</td>
                        <td className="py-1.5 text-center tabular-nums">94/100</td>
                        <td className="py-1.5 text-center font-medium text-stone-900">O</td>
                        <td className="py-1.5 text-right font-medium text-stone-900 tabular-nums">40.0</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">
                          <div className="font-medium text-stone-900">Theory of Computation</div>
                          <div className="text-[10px] text-stone-500">CS402</div>
                        </td>
                        <td className="py-1.5 text-center tabular-nums">4.0</td>
                        <td className="py-1.5 text-center tabular-nums">86/100</td>
                        <td className="py-1.5 text-center font-medium text-stone-900">A+</td>
                        <td className="py-1.5 text-right font-medium text-stone-900 tabular-nums">36.0</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">
                          <div className="font-medium text-stone-900">Computer Networks</div>
                          <div className="text-[10px] text-stone-500">CS403</div>
                        </td>
                        <td className="py-1.5 text-center tabular-nums">4.0</td>
                        <td className="py-1.5 text-center tabular-nums">82/100</td>
                        <td className="py-1.5 text-center font-medium text-stone-900">A</td>
                        <td className="py-1.5 text-right font-medium text-stone-900 tabular-nums">32.0</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">
                          <div className="font-medium text-stone-900">Operating Systems Lab</div>
                          <div className="text-[10px] text-stone-500">CS404P</div>
                        </td>
                        <td className="py-1.5 text-center tabular-nums">2.0</td>
                        <td className="py-1.5 text-center tabular-nums">48/50</td>
                        <td className="py-1.5 text-center font-medium text-stone-900">O</td>
                        <td className="py-1.5 text-right font-medium text-stone-900 tabular-nums">20.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Score Summary Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3.5 py-2 border border-stone-100">
                  <div className="text-xs text-stone-600">
                    <span>Total Credits: </span>
                    <span className="font-medium text-stone-900 tabular-nums">14.0</span>
                    <span className="mx-2 text-stone-300">|</span>
                    <span>Marks: </span>
                    <span className="font-medium text-stone-900 tabular-nums">310/350</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-600">SGPA:</span>
                    <span className="rounded bg-[#831825] px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                      9.14
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      Pass
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-xs text-stone-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-stone-400" />
            <span>Shri Ram Group of Colleges • Examination Division</span>
          </div>
          <div className="text-stone-400 text-[11px]">
            Authorized institutional access only
          </div>
        </div>
      </footer>
    </div>
  );
}
