import { getCurrentSession } from "@/lib/auth/get-session";
import { StudentResultService } from "@/services/student-result.service";
import { Download, AlertTriangle, FileText, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.studentId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-base font-semibold">Student profile not linked</h2>
        <p className="mt-1 text-xs">
          No student profile is currently linked with this login identifier ({session?.user.identifier}).
          Please contact the College Examination Cell.
        </p>
      </div>
    );
  }

  const results = await StudentResultService.getPublishedResultsForStudent(
    session.user,
    session.user.studentId
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
              Academic Results and Transcripts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Official published examination performance records for Roll Number:{" "}
              <span className="font-medium text-slate-800 tabular-nums">{session.user.identifier}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Academic Year 2025–2026</span>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <FileText className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">No published results found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Examination results for your current term have not yet been officially published by the administration.
            Please check back after official announcement.
          </p>
        </div>
      ) : (
        results.map((item) => {
          const res = item.result;
          const isPassed = res.status === "PASS";
          const isWithheld = res.status === "WITHHELD";

          return (
            <div
              key={item.examinationId}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
            >
              {/* Exam Header */}
              <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-block rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      {item.program} — {item.semester}
                    </span>
                    <h2 className="mt-1.5 text-base sm:text-lg font-semibold text-slate-900">
                      {item.examinationTitle}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Published: {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  {/* PDF Download Button */}
                  <div>
                    <a
                      href={`/api/student/result-card?examId=${item.examinationId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#831825] px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#6d1521]"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-400" />
                      <span>Download official PDF card</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Withheld Notice if applicable */}
              {isWithheld && (
                <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">Result withheld: </span>
                    {res.statusRemarks || "Please contact the College Examination Cell regarding administrative verification."}
                  </div>
                </div>
              )}

              {/* Subject Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Subject Code</th>
                      <th className="px-6 py-3">Subject Name</th>
                      <th className="px-6 py-3 text-center">Credits</th>
                      <th className="px-6 py-3 text-center">Max Marks</th>
                      <th className="px-6 py-3 text-center">Marks Obtained</th>
                      <th className="px-6 py-3 text-center">Grade</th>
                      <th className="px-6 py-3 text-center">Grade Point</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {res.subjects.map((sub) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {sub.subjectCode}
                        </td>
                        <td className="px-6 py-3">{sub.subjectName || "Core Course"}</td>
                        <td className="px-6 py-3 text-center font-medium tabular-nums">
                          {sub.credits.toFixed(1)}
                        </td>
                        <td className="px-6 py-3 text-center tabular-nums">{sub.maxTotalMarks}</td>
                        <td className="px-6 py-3 text-center font-medium text-slate-900 tabular-nums">
                          {sub.totalMarksObtained !== null ? sub.totalMarksObtained : "—"}
                        </td>
                        <td className="px-6 py-3 text-center font-semibold text-slate-900">
                          {sub.grade}
                        </td>
                        <td className="px-6 py-3 text-center tabular-nums">{sub.gradePoint.toFixed(1)}</td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                              sub.status === "PASS"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                          >
                            {sub.status === "PASS" ? "Pass" : sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Metrics Footer */}
              <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                    <span className="text-[11px] text-slate-500">Credits offered</span>
                    <div className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
                      {res.totalCreditsOffered}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                    <span className="text-[11px] text-slate-500">Credits earned</span>
                    <div className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
                      {res.totalCreditsEarned}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                    <span className="text-[11px] text-slate-500">Semester SGPA</span>
                    <div className="mt-0.5 text-base font-semibold text-slate-950 tabular-nums">
                      {res.sgpa !== null ? res.sgpa.toFixed(2) : "N/A"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                    <span className="text-[11px] text-slate-500">Final outcome</span>
                    <div
                      className={`mt-0.5 text-base font-semibold ${
                        isPassed
                          ? "text-emerald-700"
                          : isWithheld
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {res.status === "PASS" ? "Passed" : res.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
