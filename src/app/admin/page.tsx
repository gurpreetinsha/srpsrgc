import { prisma } from "@/lib/db/prisma";
import { OnboardingService } from "@/services/onboarding.service";
import {
  Users,
  GraduationCap,
  Building,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const onboarding = await OnboardingService.getOnboardingStatus();

  const [
    studentCount,
    facultyCount,
    programCount,
    examCount,
    publishedCount,
    recentExams,
    recentAudits,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.program.count(),
    prisma.examination.count(),
    prisma.resultPublication.count(),
    prisma.examination.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { program: true, semester: true, academicYear: true, publication: true },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#991b1b]">
            Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Shri Ram Group of Colleges &bull; Master result orchestration, publication, and institutional data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            System Operational
          </span>
        </div>
      </div>

      {/* Institutional Statistics Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Students Enrolled
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{studentCount}</div>
          <div className="mt-1 text-xs text-slate-500">Registered across all batches</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Faculty Instructors
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{facultyCount}</div>
          <div className="mt-1 text-xs text-slate-500">Active teaching staff</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Degree Programs
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{programCount}</div>
          <div className="mt-1 text-xs text-slate-500">Department curriculum courses</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Exams Published
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {publishedCount} / {examCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Official sessions finalized</div>
        </div>
      </div>

      {/* Guided Onboarding Wizard Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-red-800 bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] p-5 sm:p-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <h2 className="text-base sm:text-lg font-bold">Institutional Setup & Onboarding Wizard</h2>
              </div>
              <p className="mt-1 text-xs text-red-100">
                Complete all foundational milestones to ensure strict academic compliance and error-free result publication.
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-2xl font-extrabold text-white">
                {onboarding.completionPercentage}%
              </span>
              <span className="text-xs text-red-100 block">Complete</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-red-950/60">
            <div
              className="h-full bg-white transition-all duration-500 shadow"
              style={{ width: `${onboarding.completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onboarding.steps.map((step) => {
              return (
                <div
                  key={step.key}
                  className={`flex flex-col justify-between rounded-lg border p-4 transition ${
                    step.isComplete
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{step.label}</span>
                      {step.isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{step.description}</p>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-slate-600">
                    Registered: <span className="text-slate-900 font-bold">{step.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Examinations & Recent Audit Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Examinations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900">Recent Examinations</h3>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#991b1b] hover:underline"
            >
              <span>Manage Exams</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentExams.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No examination sessions created yet.
              </div>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{exam.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {exam.program.name} &bull; {exam.semester.title} &bull; {exam.academicYear.name}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      exam.publication?.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-800"
                        : exam.status === "UNDER_REVIEW"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {exam.publication?.status === "PUBLISHED" ? "PUBLISHED" : exam.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900">Audit Trail Activity</h3>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#991b1b] hover:underline"
            >
              <span>Full Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentAudits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No audit events recorded yet.
              </div>
            ) : (
              recentAudits.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <div className="font-semibold text-xs text-slate-900">
                      {log.action} on {log.entityType}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Actor: {log.user?.identifier || "System"} &bull; {log.ipAddress || "Internal"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
