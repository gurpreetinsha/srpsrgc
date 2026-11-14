"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Award,
  Users,
  Percent,
} from "lucide-react";

interface ReportData {
  examinationId: string;
  examinationTitle: string;
  academicYear: string;
  programName: string;
  totalEnrolled: number;
  totalPassed: number;
  totalFailed: number;
  totalWithheld: number;
  passPercentage: number;
  averageSgpa: number | null;
  gradeDistribution: Record<string, number>;
}

export default function ReportsAdminPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/admin/exams");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Filter to published exams
          const published = data.filter((e) => e.publication?.status === "PUBLISHED");
          setExams(published);
          if (published.length > 0 && !selectedExamId) {
            setSelectedExamId(published[0].id);
          }
        }
      } catch {
        // non-critical
      }
    }
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/reports?examinationId=${selectedExamId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load performance report");
        setReport(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [selectedExamId]);

  return (
    <div className="space-y-5 text-stone-900 max-w-full overflow-x-hidden">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
            Reports and Academic Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Official institutional performance summaries, grade distributions, and sanitized spreadsheet exports.
          </p>
        </div>

        {/* Exam Picker */}
        {exams.length > 0 && (
          <div>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.program?.name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* When no published exams exist */}
      {exams.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <BarChart3 className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">No published examination records</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Performance analytics and exportable rosters become accessible once results are officially published in the Examinations tab.
          </p>
        </div>
      )}

      {/* Report view */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Header & Export Actions */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {report.programName}
              </span>
              <h2 className="mt-1.5 text-lg sm:text-xl font-semibold text-slate-900">{report.examinationTitle}</h2>
              <p className="text-xs text-slate-500">Academic Year: {report.academicYear}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/admin/reports/export?examinationId=${report.examinationId}&format=csv`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </a>

              <a
                href={`/api/admin/reports/export?examinationId=${report.examinationId}&format=xlsx`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#831825] px-3.5 py-2 text-xs font-medium text-white shadow-2xs hover:bg-[#6d1521]"
              >
                <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                <span>Export Excel (.xlsx)</span>
              </a>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Candidates</span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{report.totalEnrolled}</div>
              <div className="mt-1 text-xs text-slate-400">Snapshot candidate roster</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Pass Rate</span>
                <Percent className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700">{report.passPercentage}%</div>
              <div className="mt-1 text-xs text-slate-500">
                {report.totalPassed} Passed • {report.totalFailed} Failed
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Average SGPA</span>
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
                {report.averageSgpa !== null ? report.averageSgpa : "N/A"}
              </div>
              <div className="mt-1 text-xs text-slate-400">Across passing candidates</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Withheld</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-amber-700">{report.totalWithheld}</div>
              <div className="mt-1 text-xs text-slate-400">Pending administrative clearance</div>
            </div>
          </div>

          {/* Grade Distribution Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900">Course Subject Grade Distribution</h3>
            <p className="text-xs text-slate-500">
              Aggregated frequency of letter grades assigned across all examination course subjects.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
              {Object.entries(report.gradeDistribution).map(([grade, count]) => (
                <div
                  key={grade}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center"
                >
                  <div className="text-xs font-semibold text-slate-900">{grade}</div>
                  <div className="mt-1 text-base font-semibold tabular-nums text-slate-900">{count}</div>
                  <div className="text-[10px] text-slate-400">marks</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
