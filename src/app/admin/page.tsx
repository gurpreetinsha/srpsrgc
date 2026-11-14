import { prisma } from "@/lib/db/prisma";
import { OnboardingService } from "@/services/onboarding.service";
import {
  Users,
  GraduationCap,
  Building,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
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
    <div className="space-y-5 text-stone-900 max-w-full overflow-x-hidden">
      {/* Overview Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
            Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Shri Ram Group of Colleges • Result orchestration, publication, and institutional records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            System operational
          </span>
        </div>
      </div>

      {/* Institutional Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Students enrolled
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{studentCount}</div>
          <div className="mt-1 text-xs text-slate-500">Registered across all batches</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Faculty instructors
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{facultyCount}</div>
          <div className="mt-1 text-xs text-slate-500">Active teaching staff</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Degree programs
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{programCount}</div>
          <div className="mt-1 text-xs text-slate-500">Department curriculum courses</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Exams published
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">
            {publishedCount} <span className="text-sm font-normal text-slate-400">/ {examCount}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Official sessions finalized</div>
        </div>
      </div>

      {/* Guided Onboarding Wizard Card */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
        <div className="border-b border-[#2d161c] bg-[#180d10] p-4 sm:p-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm sm:text-base font-semibold">Institutional setup and onboarding</h2>
              </div>
              <p className="mt-1 text-xs text-stone-300">
                Foundational academic milestones required before result evaluation and publication.
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xl font-semibold text-white tabular-nums">
                {onboarding.completionPercentage}%
              </span>
              <span className="text-[11px] text-stone-400 block">Complete</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#2a141a]">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
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
                  className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                    step.isComplete
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{step.label}</span>
                      {step.isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">{step.description}</p>
                  </div>
                  <div className="mt-3 text-[11px] font-medium text-slate-600">
                    Registered: <span className="text-slate-900 font-semibold tabular-nums">{step.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Examinations & Recent Audit Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Examinations */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent examinations</h3>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              <span>Manage exams</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentExams.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No examination sessions created yet.
              </div>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-900">{exam.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {exam.program.name} • {exam.semester.title} • {exam.academicYear.name}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                      exam.publication?.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : exam.status === "UNDER_REVIEW"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {exam.publication?.status === "PUBLISHED" ? "Published" : exam.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-semibold text-slate-900">Audit trail activity</h3>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              <span>Full audit logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentAudits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No audit events recorded yet.
              </div>
            ) : (
              recentAudits.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <div className="text-xs font-medium text-slate-900">
                      {log.action} on {log.entityType}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Actor: {log.user?.identifier || "System"} • {log.ipAddress || "Internal"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-slate-400 tabular-nums">
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
