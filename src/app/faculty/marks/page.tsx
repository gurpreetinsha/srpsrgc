"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Save,
  Send,
  Upload,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  Download,
} from "lucide-react";
import Link from "next/link";

interface StudentMarkRow {
  enrollmentId: string;
  rollNumber: string;
  regNumber: string;
  studentName: string;
  section: string;
  internalMarks: number | null;
  externalMarks: number | null;
  totalMarks: number | null;
  isAbsent: boolean;
  isWithheld: boolean;
  status: string;
  feedback?: string | null;
}

interface ExamSubjectDetails {
  id: string;
  subjectCode: string;
  subjectName: string;
  maxInternalMarks: number;
  maxExternalMarks: number;
  passingMarks: number;
  examinationTitle: string;
  program: string;
  semester: string;
  academicYear: string;
  examStatus: string;
}

function MarksEntryContent() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [examSubject, setExamSubject] = useState<ExamSubjectDetails | null>(null);
  const [roster, setRoster] = useState<StudentMarkRow[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<Array<{ rowNumber: number; message: string }>>([]);
  const [importing, setImporting] = useState(false);

  const subjectId = searchParams.get("subjectId");
  const sectionId = searchParams.get("sectionId");
  const semesterId = searchParams.get("semesterId");
  const examSubjectId = searchParams.get("examinationSubjectId");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (examSubjectId) params.append("examinationSubjectId", examSubjectId);
        if (subjectId) params.append("subjectId", subjectId);
        if (sectionId) params.append("sectionId", sectionId);
        if (semesterId) params.append("semesterId", semesterId);

        const res = await fetch(`/api/faculty/marks?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load marks entry roster");
        }

        setExamSubject(data.examSubject);
        setRoster(data.roster);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [subjectId, sectionId, semesterId, examSubjectId]);

  const handleMarkChange = (
    enrollmentId: string,
    field: "internalMarks" | "externalMarks",
    value: string
  ) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.enrollmentId !== enrollmentId) return r;
        const numVal = value === "" ? null : parseFloat(value);
        const internal = field === "internalMarks" ? numVal : r.internalMarks;
        const external = field === "externalMarks" ? numVal : r.externalMarks;
        const total = internal !== null && external !== null ? internal + external : null;
        return {
          ...r,
          [field]: numVal,
          totalMarks: total,
        };
      })
    );
  };

  const handleCheckboxChange = (
    enrollmentId: string,
    field: "isAbsent" | "isWithheld",
    checked: boolean
  ) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.enrollmentId !== enrollmentId) return r;
        return {
          ...r,
          [field]: checked,
          ...(field === "isAbsent" && checked
            ? { internalMarks: 0, externalMarks: 0, totalMarks: 0 }
            : {}),
        };
      })
    );
  };

  const saveMarks = async (saveAsDraft: boolean) => {
    if (!examSubject) return;

    try {
      setError(null);
      setSuccessMessage(null);

      // If submitting for review, validate that every student has marks or absent/withheld flags
      if (!saveAsDraft) {
        for (const row of roster) {
          if (!row.isAbsent && !row.isWithheld) {
            if (row.internalMarks === null || row.externalMarks === null) {
              setError(
                `All enrolled students must have marks entered before submission. Missing marks for ${row.studentName} (${row.rollNumber}).`
              );
              return;
            }
          }
        }
      }

      const payload = {
        examinationSubjectId: examSubject.id,
        saveAsDraft,
        marks: roster.map((r) => ({
          examinationEnrollmentId: r.enrollmentId,
          internalMarks: r.internalMarks,
          externalMarks: r.externalMarks,
          isAbsent: r.isAbsent,
          isWithheld: r.isWithheld,
        })),
      };

      const res = await fetch("/api/faculty/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save marks");
      }

      setSuccessMessage(
        saveAsDraft
          ? "Marks draft saved successfully."
          : "Marks successfully submitted for administrative examination review."
      );

      // Update roster status locally
      const newStatus = saveAsDraft ? "DRAFT" : "SUBMITTED";
      setRoster((prev) => prev.map((r) => ({ ...r, status: newStatus })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit marks");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !examSubject) return;

    try {
      setImporting(true);
      setImportErrors([]);

      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("examinationSubjectId", examSubject.id);

      const res = await fetch("/api/faculty/marks/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process import file");
      }

      if (data.errors && data.errors.length > 0) {
        setImportErrors(data.errors);
      }

      if (data.matchedMarks && data.matchedMarks.length > 0) {
        const importMap = new Map<string, (typeof data.matchedMarks)[0]>(
          data.matchedMarks.map((m: any) => [m.examinationEnrollmentId, m])
        );

        setRoster((prev) =>
          prev.map((r) => {
            const imp = importMap.get(r.enrollmentId);
            if (!imp) return r;
            const internal = imp.internalMarks ?? r.internalMarks;
            const external = imp.externalMarks ?? r.externalMarks;
            const total = internal !== null && external !== null ? internal + external : null;
            return {
              ...r,
              internalMarks: internal,
              externalMarks: external,
              totalMarks: total,
              isAbsent: imp.isAbsent,
              isWithheld: imp.isWithheld,
            };
          })
        );

        setSuccessMessage(`Successfully imported marks for ${data.previewCount} students.`);
        if (data.errors.length === 0) {
          setShowImportModal(false);
          setImportFile(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    if (!roster.length) return;
    const headers = "Roll Number,Student Name,Internal Marks,External Marks,Absent (YES/NO),Withheld (YES/NO)\n";
    const rows = roster
      .map(
        (r) =>
          `"${r.rollNumber}","${r.studentName}","${r.internalMarks ?? ""}","${r.externalMarks ?? ""}","${r.isAbsent ? "YES" : "NO"}","${r.isWithheld ? "YES" : "NO"}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marks_Template_${examSubject?.subjectCode || "Course"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-transparent mx-auto mb-2"></div>
          <p className="text-xs font-medium text-slate-500">Loading student marks roster...</p>
        </div>
      </div>
    );
  }

  if (error && !examSubject) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-bold">Failed to Load Examination Roster</h2>
        </div>
        <p className="mt-2 text-sm text-red-800">{error}</p>
        <div className="mt-4">
          <Link
            href="/faculty"
            className="inline-flex items-center gap-2 rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitted = roster.length > 0 && roster[0]?.status === "SUBMITTED";
  const isApproved = roster.length > 0 && roster[0]?.status === "APPROVED";
  const hasFeedback = roster.some((r) => !!r.feedback);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/faculty"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to assignments</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsvTemplate}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Template CSV</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            type="button"
            disabled={isApproved}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Import CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 tabular-nums">
                {examSubject?.subjectCode}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {examSubject?.examinationTitle}
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
              {examSubject?.subjectName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {examSubject?.program} • {examSubject?.semester} • Academic Year: {examSubject?.academicYear}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
            <div className="rounded-lg bg-slate-50 px-2.5 sm:px-3 py-2 text-center border border-slate-200">
              <div className="text-[10px] uppercase font-medium text-slate-500">Max Internal</div>
              <div className="text-base sm:text-lg font-semibold tabular-nums text-slate-900">{examSubject?.maxInternalMarks}</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-2.5 sm:px-3 py-2 text-center border border-slate-200">
              <div className="text-[10px] uppercase font-medium text-slate-500">Max External</div>
              <div className="text-base sm:text-lg font-semibold tabular-nums text-slate-900">{examSubject?.maxExternalMarks}</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-2.5 sm:px-3 py-2 text-center border border-slate-200">
              <div className="text-[10px] uppercase font-medium text-slate-500">Min Pass</div>
              <div className="text-base sm:text-lg font-semibold tabular-nums text-slate-900">{examSubject?.passingMarks}</div>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {isSubmitted && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Submitted for Administrative Review:</strong> Marks are currently under review by the Examination Cell. You can still update drafts if needed prior to administrative approval.
            </span>
          </div>
        )}

        {isApproved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span>
              <strong>Approved by Administration:</strong> Marks for this course have been verified and approved by the Examination Cell. Further changes require formal correction requests.
            </span>
          </div>
        )}

        {hasFeedback && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Administrative Feedback / Rejection Note:</span>
            </div>
            <div className="mt-1 pl-5">
              {roster.find((r) => r.feedback)?.feedback}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800">
          {successMessage}
        </div>
      )}

      {/* Student Roster Marks Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Roll Number</th>
                <th className="px-4 py-3 font-medium">Reg Number</th>
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium text-center">
                  Internal (Max {examSubject?.maxInternalMarks})
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  External (Max {examSubject?.maxExternalMarks})
                </th>
                <th className="px-4 py-3 font-medium text-center">Total</th>
                <th className="px-4 py-3 font-medium text-center">Absent</th>
                <th className="px-4 py-3 font-medium text-center">Withheld</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((row, idx) => {
                const isRowAbsent = row.isAbsent;
                const isRowWithheld = row.isWithheld;

                return (
                  <tr key={row.enrollmentId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.rollNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{row.regNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.studentName}</td>
                    <td className="px-4 py-3 text-slate-500">{row.section}</td>

                    {/* Internal Marks Input */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={examSubject?.maxInternalMarks}
                        step="0.5"
                        disabled={isRowAbsent || isRowWithheld || isApproved}
                        value={row.internalMarks !== null ? row.internalMarks : ""}
                        onChange={(e) =>
                          handleMarkChange(row.enrollmentId, "internalMarks", e.target.value)
                        }
                        placeholder="0.0"
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-medium text-slate-800 tabular-nums focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>

                    {/* External Marks Input */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={examSubject?.maxExternalMarks}
                        step="0.5"
                        disabled={isRowAbsent || isRowWithheld || isApproved}
                        value={row.externalMarks !== null ? row.externalMarks : ""}
                        onChange={(e) =>
                          handleMarkChange(row.enrollmentId, "externalMarks", e.target.value)
                        }
                        placeholder="0.0"
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-medium text-slate-800 tabular-nums focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>

                    {/* Total Marks */}
                    <td className="px-4 py-3 text-center font-medium text-slate-900 tabular-nums">
                      {isRowAbsent ? (
                        <span className="text-red-700 font-medium">AB</span>
                      ) : row.totalMarks !== null ? (
                        row.totalMarks
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Absent Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        disabled={isApproved}
                        onChange={(e) =>
                          handleCheckboxChange(row.enrollmentId, "isAbsent", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Withheld Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.isWithheld}
                        disabled={isApproved}
                        onChange={(e) =>
                          handleCheckboxChange(row.enrollmentId, "isWithheld", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          row.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : row.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-800"
                            : row.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Total Enrolled Candidates: <strong className="text-slate-800">{roster.length}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => saveMarks(true)}
              disabled={isApproved}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => saveMarks(false)}
              disabled={isApproved}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f2342] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#0b1727] disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-amber-400" />
              <span>Submit for administrative review</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV / Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Import Marks from CSV or Excel (.xlsx)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Upload a spreadsheet containing student roll numbers and marks. Columns recognized:{" "}
              <code className="text-slate-800 font-mono">Roll Number</code>,{" "}
              <code className="text-slate-800 font-mono">Internal Marks</code>,{" "}
              <code className="text-slate-800 font-mono">External Marks</code>.
            </p>

            <form onSubmit={handleImportSubmit} className="mt-4 space-y-4">
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#0f2342] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#0b1727]"
                />
              </div>

              {importErrors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 space-y-1">
                  <div className="font-semibold">Errors found in file:</div>
                  {importErrors.map((err, i) => (
                    <div key={i}>
                      Line {err.rowNumber}: {err.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2342] px-4 py-2 text-xs font-medium text-white hover:bg-[#0b1727] disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{importing ? "Processing..." : "Upload and validate"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarksEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
        </div>
      }
    >
      <MarksEntryContent />
    </Suspense>
  );
}
