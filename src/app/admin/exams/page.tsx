"use client";

import { useEffect, useState } from "react";
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function ExaminationsAdminPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);
  const [gateCheck, setGateCheck] = useState<{ canPublish: boolean; errors: string[] } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Metadata for forms
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [showCorrectModal, setShowCorrectModal] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [examForm, setExamForm] = useState({
    programId: "",
    academicYearId: "",
    semesterId: "",
    session: "Winter 2025",
    title: "",
    startDate: "",
    endDate: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    subjectId: "",
    maxInternalMarks: 30,
    maxExternalMarks: 70,
    passingMarks: 40,
    weightage: 1.0,
  });

  const [unpublishReason, setUnpublishReason] = useState("");
  const [correctionForm, setCorrectionForm] = useState({
    markId: "",
    version: 1,
    newInternalMarks: 0,
    newExternalMarks: 0,
    reason: "",
  });

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/exams");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load exams");
      setExams(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading exams");
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/exams?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load exam detail");
      setSelectedExamDetail(data.exam);
      setGateCheck(data.gateCheck);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading detail");
    }
  };

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/admin/academic");
      const data = await res.json();
      if (res.ok) {
        setPrograms(data.programs || []);
        setAcademicYears(data.academicYears || []);
        setSubjects(data.subjects || []);
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    loadExams();
    loadMetadata();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetail(selectedExamId);
    }
  }, [selectedExamId]);

  const handleProgramSelect = async (progId: string) => {
    setExamForm((prev) => ({ ...prev, programId: progId, semesterId: "" }));
    if (!progId) {
      setSemesters([]);
      return;
    }
    const prog = programs.find((p) => p.id === progId);
    if (prog) {
      try {
        const res = await fetch(`/api/admin/academic?type=all`);
        const data = await res.json();
        const found = (data.programs as any[])?.find((p) => p.id === progId);
        if (found?.semesters) {
          setSemesters(found.semesters);
        }
      } catch {
        // non-critical
      }
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", data: examForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create examination");

      setSuccess("Examination created successfully.");
      setShowCreateModal(false);
      await loadExams();
      setSelectedExamId(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreezeRoster = async () => {
    if (!selectedExamId) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "freezeRoster", data: { examinationId: selectedExamId } }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to freeze student roster");

      setSuccess(`Student roster snapshot frozen (${data.enrolledCount} eligible students locked in).`);
      await loadExamDetail(selectedExamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Freeze failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSubject",
          data: { examinationId: selectedExamId, ...subjectForm },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add examination subject");

      setSuccess("Examination subject added successfully.");
      setShowAddSubjectModal(false);
      await loadExamDetail(selectedExamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Add subject failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewMarks = async (examSubjectId: string, action: "APPROVE" | "REJECT", rejectionReason?: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reviewMarks",
          data: {
            examinationSubjectId: examSubjectId,
            action,
            rejectionReason: rejectionReason || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review marks");

      setSuccess(`Marks ${action === "APPROVE" ? "approved" : "rejected with feedback"}.`);
      if (selectedExamId) await loadExamDetail(selectedExamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExamDetail) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/exams/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examinationId: selectedExamDetail.id,
          version: selectedExamDetail.publication?.version || 1,
          confirmedByAdmin: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publication failed");

      setSuccess(`Results published successfully! (Evaluated ${data.studentCount} students, Version ${data.version}).`);
      await loadExams();
      await loadExamDetail(selectedExamDetail.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Publication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamDetail || !unpublishReason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/exams/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examinationId: selectedExamDetail.id,
          version: selectedExamDetail.publication?.version || 1,
          unpublishReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unpublish failed");

      setSuccess("Results successfully unpublished with mandatory institutional audit reason.");
      setShowUnpublishModal(false);
      setUnpublishReason("");
      await loadExams();
      await loadExamDetail(selectedExamDetail.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unpublish failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.markId || !correctionForm.reason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/exams/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(correctionForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Correction failed");

      setSuccess("Marks corrected and audited. New marks recorded with optimistic concurrency.");
      setShowCorrectModal(null);
      if (selectedExamId) await loadExamDetail(selectedExamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Correction failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#991b1b]">
            Examinations & Result Publication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Orchestrate examination sessions, lock student rosters, moderate faculty marks, and publish official results.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#991b1b] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#7f1d1d] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Examination Session</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-xs text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Exams List (Left) & Selected Exam Detail (Right) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Examination Sessions */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Examination Sessions ({exams.length})
          </h2>

          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#991b1b] border-t-transparent"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                No examination sessions created yet.
              </div>
            ) : (
              exams.map((exam) => {
                const isSelected = selectedExamId === exam.id;
                const isPub = exam.publication?.status === "PUBLISHED";

                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-[#991b1b] bg-white shadow-md ring-1 ring-[#991b1b]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#991b1b]">
                        {exam.session}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          isPub
                            ? "bg-emerald-100 text-emerald-800"
                            : exam.status === "UNDER_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isPub ? "PUBLISHED" : exam.status}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-slate-900">{exam.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {exam.program?.name} &bull; {exam.semester?.title}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                      <span>Subjects: {exam._count?.examSubjects || 0}</span>
                      <span>Enrolled: {exam._count?.enrollments || 0}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Exam Operations Console */}
        <div className="lg:col-span-2">
          {!selectedExamDetail ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
              <FileCheck2 className="h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Select an examination session</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose an exam from the left panel to review marks, freeze student roster snapshots, run pre-publication checks, or publish results.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Exam Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#991b1b] px-2.5 py-0.5 text-xs font-bold text-white">
                      {selectedExamDetail.session}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Version: {selectedExamDetail.publication?.version || 1}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {selectedExamDetail.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedExamDetail.program?.name} &bull; {selectedExamDetail.semester?.title} &bull; Academic Year: {selectedExamDetail.academicYear?.name}
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {selectedExamDetail.publication?.status === "PUBLISHED" ? (
                    <button
                      onClick={() => setShowUnpublishModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Unpublish Results</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePublishResults}
                      disabled={!gateCheck?.canPublish || submitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Publish Results Officially</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pre-publication Integrity Checklist */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  gateCheck?.canPublish
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-amber-200 bg-amber-50/50 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-2">
                    {gateCheck?.canPublish ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    Pre-Publication Integrity Gates
                  </span>
                  <span>
                    {gateCheck?.canPublish ? "All 6 Gates Passed" : `${gateCheck?.errors.length} Gate Violations`}
                  </span>
                </div>

                {!gateCheck?.canPublish && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-[11px] text-amber-800">
                    {gateCheck?.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Roster & Snapshot Controls */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Candidate Enrollment Snapshot Roster
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Snapshot frozen: <strong className="text-slate-900">{selectedExamDetail.enrollments?.length || 0} students</strong>. Results are calculated exclusively against frozen snapshots.
                  </p>
                </div>
                <button
                  onClick={handleFreezeRoster}
                  disabled={submitting || selectedExamDetail.publication?.status === "PUBLISHED"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <Users className="h-3.5 w-3.5 text-[#991b1b]" />
                  <span>Freeze / Sync Snapshot</span>
                </button>
              </div>

              {/* Exam Subjects & Marks Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Configured Examination Subjects
                  </h3>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    disabled={selectedExamDetail.publication?.status === "PUBLISHED"}
                    className="inline-flex items-center gap-1 rounded bg-[#991b1b] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#7f1d1d] disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {selectedExamDetail.examSubjects?.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No subjects added to this examination yet.
                    </div>
                  ) : (
                    selectedExamDetail.examSubjects?.map((es: any) => {
                      const marksEntered = es.marks?.length || 0;
                      const hasUnapproved = es.marks?.some((m: any) => m.status === "SUBMITTED");

                      return (
                        <div key={es.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#991b1b]">
                                {es.subject.code}
                              </span>
                              <span className="font-medium text-xs text-slate-800">
                                {es.subject.name}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              Max Internal: {es.maxInternalMarks} &bull; Max External: {es.maxExternalMarks} &bull; Pass Mark: {es.minTotalMarks}
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-600">
                              Marks Recorded: {marksEntered} / {selectedExamDetail.enrollments?.length || 0}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasUnapproved && (
                              <button
                                onClick={() => handleReviewMarks(es.id, "APPROVE")}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve Marks
                              </button>
                            )}
                            <Link
                              href={`/faculty/marks?examinationSubjectId=${es.id}`}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <span>Inspect Grid</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE EXAM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">New Examination Session</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Program</label>
                <select
                  required
                  value={examForm.programId}
                  onChange={(e) => handleProgramSelect(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                >
                  <option value="">Select Degree Program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Semester</label>
                <select
                  required
                  value={examForm.semesterId}
                  onChange={(e) => setExamForm({ ...examForm, semesterId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                >
                  <option value="">Select Semester...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (Semester {s.semesterNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Academic Year</label>
                <select
                  required
                  value={examForm.academicYearId}
                  onChange={(e) => setExamForm({ ...examForm, academicYearId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                >
                  <option value="">Select Academic Year...</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End Semester Examination Dec 2025"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter 2025"
                  value={examForm.session}
                  onChange={(e) => setExamForm({ ...examForm, session: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-[#991b1b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-[#991b1b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#991b1b] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7f1d1d]"
                >
                  {submitting ? "Creating..." : "Establish Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Add Examination Subject</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Course Subject</label>
                <select
                  required
                  value={subjectForm.subjectId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Max Internal</label>
                  <input
                    type="number"
                    required
                    value={subjectForm.maxInternalMarks}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, maxInternalMarks: parseFloat(e.target.value) || 30 })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Max External</label>
                  <input
                    type="number"
                    required
                    value={subjectForm.maxExternalMarks}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, maxExternalMarks: parseFloat(e.target.value) || 70 })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Minimum Passing Marks</label>
                <input
                  type="number"
                  required
                  value={subjectForm.passingMarks}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, passingMarks: parseFloat(e.target.value) || 40 })
                  }
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#991b1b] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7f1d1d]"
                >
                  {submitting ? "Adding..." : "Add to Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UNPUBLISH REASON */}
      {showUnpublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base border-b border-slate-100 pb-3">
              <AlertTriangle className="h-5 w-5" />
              <span>Unpublish Examination Results</span>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              Unpublishing results revokes student access to grade cards and online transcripts. In accordance with SRGC institutional policy, an official reason is mandatory and will be recorded in the immutable audit trail.
            </p>

            <form onSubmit={handleUnpublishResults} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Official Unpublish Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Marks reconciliation requested by Controller of Examinations for Paper CS-501."
                  value={unpublishReason}
                  onChange={(e) => setUnpublishReason(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnpublishModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !unpublishReason.trim()}
                  className="rounded bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  {submitting ? "Revoking..." : "Confirm & Unpublish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUDITED CORRECTION */}
      {showCorrectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-base border-b border-slate-100 pb-3">
              <RotateCcw className="h-5 w-5" />
              <span>Audited Marks Correction</span>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              Modifying published results updates the official version and creates an immutable correction audit log.
            </p>

            <form onSubmit={handleCorrectMark} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">New Internal Marks</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={correctionForm.newInternalMarks}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, newInternalMarks: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">New External Marks</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={correctionForm.newExternalMarks}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, newExternalMarks: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Mandatory Correction Justification</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Recalculation after student re-evaluation request approved by Dean."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectModal(null)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !correctionForm.reason.trim()}
                  className="rounded bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  {submitting ? "Applying..." : "Submit Audited Correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
