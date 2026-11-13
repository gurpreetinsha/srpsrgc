import { getCurrentSession } from "@/lib/auth/get-session";
import { StudentResultService } from "@/services/student-result.service";
import { Download, AlertTriangle, FileText, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.studentId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-bold">Student Profile Not Linked</h2>
        <p className="mt-1 text-sm">
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#991b1b]">
              Academic Results & Transcripts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Official published examination performance records for Roll No:{" "}
              <span className="font-semibold text-slate-800">{session.user.identifier}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Calendar className="h-4 w-4 text-[#991b1b]" />
            <span>Academic Year 2025-2026</span>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <FileText className="mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">No Published Results Found</h3>
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
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Exam Header */}
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-block rounded bg-[#991b1b] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {item.program} — {item.semester}
                    </span>
                    <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                      {item.examinationTitle}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Published on: {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "-"}
                    </p>
                  </div>

                  {/* PDF Download Button */}
                  <div>
                    <a
                      href={`/api/student/result-card?examId=${item.examinationId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#991b1b] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#7f1d1d]"
                    >
                      <Download className="h-4 w-4 text-white" />
                      <span>Download Official PDF Card</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Withheld Notice if applicable */}
              {isWithheld && (
                <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 text-sm text-amber-900">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">Result Withheld: </span>
                    {res.statusRemarks || "Please contact the College Examination Cell regarding administrative verification."}
                  </div>
                </div>
              )}

              {/* Subject Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-700">
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
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {sub.subjectCode}
                        </td>
                        <td className="px-6 py-3.5">{sub.subjectName || "Core Course"}</td>
                        <td className="px-6 py-3.5 text-center font-medium">
                          {sub.credits.toFixed(1)}
                        </td>
                        <td className="px-6 py-3.5 text-center">{sub.maxTotalMarks}</td>
                        <td className="px-6 py-3.5 text-center font-semibold text-slate-900">
                          {sub.totalMarksObtained !== null ? sub.totalMarksObtained : "-"}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-[#991b1b]">
                          {sub.grade}
                        </td>
                        <td className="px-6 py-3.5 text-center">{sub.gradePoint.toFixed(1)}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                              sub.status === "PASS"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Metrics Footer */}
              <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Credits Offered</span>
                    <div className="mt-0.5 text-lg font-bold text-slate-900">
                      {res.totalCreditsOffered}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Credits Earned</span>
                    <div className="mt-0.5 text-lg font-bold text-slate-900">
                      {res.totalCreditsEarned}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Semester SGPA</span>
                    <div className="mt-0.5 text-lg font-bold text-[#991b1b]">
                      {res.sgpa !== null ? res.sgpa.toFixed(2) : "N/A"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Final Outcome</span>
                    <div
                      className={`mt-0.5 text-lg font-bold ${
                        isPassed
                          ? "text-emerald-700"
                          : isWithheld
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {res.status}
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
