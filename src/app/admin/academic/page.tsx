"use client";

import { useEffect, useState } from "react";
import {
  Building,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function AcademicStructurePage() {
  const [activeTab, setActiveTab] = useState<"departments" | "programs" | "years" | "batches" | "subjects">("departments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Modal States
  const [showModal, setShowModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [progForm, setProgForm] = useState({ departmentId: "", name: "", code: "", totalSemesters: 8 });
  const [yearForm, setYearForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });
  const [batchForm, setBatchForm] = useState({ programId: "", academicYearId: "", name: "" });
  const [subjectForm, setSubjectForm] = useState({ departmentId: "", code: "", name: "", type: "THEORY" });

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/academic");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load academic structure");

      setDepartments(data.departments || []);
      setPrograms(data.programs || []);
      setAcademicYears(data.academicYears || []);
      setBatches(data.batches || []);
      setSubjects(data.subjects || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (type: string, data: any) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || `Failed to create ${type}`);

      setSuccess(`Successfully added new ${type}.`);
      setShowModal(null);
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f2042]">
            Academic Structure Management
          </h1>
          <p className="text-sm text-slate-500">
            Define institutional hierarchy: departments, degree programs, calendar years, batches, and course subjects.
          </p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "departments"
              ? "bg-[#0f2042] text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("programs")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "programs"
              ? "bg-[#0f2042] text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Programs ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("years")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "years"
              ? "bg-[#0f2042] text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Academic Years ({academicYears.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "batches"
              ? "bg-[#0f2042] text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Batches & Sections ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "subjects"
              ? "bg-[#0f2042] text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Subjects & Credits ({subjects.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f2042] border-t-transparent"></div>
        </div>
      ) : (
        <div>
          {/* DEPARTMENTS TAB */}
          {activeTab === "departments" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Academic Departments</h3>
                <button
                  onClick={() => setShowModal("department")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2042] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1a3466]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#c69214]" />
                  <span>Add Department</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f2042] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Department Name</th>
                    <th className="px-4 py-3 font-semibold text-center">Programs</th>
                    <th className="px-4 py-3 font-semibold text-center">Subjects</th>
                    <th className="px-4 py-3 font-semibold text-center">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No departments registered yet. Click &quot;Add Department&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-[#0f2042]">{dept.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{dept.name}</td>
                        <td className="px-4 py-3 text-center">{dept._count?.programs || 0}</td>
                        <td className="px-4 py-3 text-center">{dept._count?.subjects || 0}</td>
                        <td className="px-4 py-3 text-center">{dept._count?.faculty || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PROGRAMS TAB */}
          {activeTab === "programs" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Degree Programs & Courses</h3>
                <button
                  onClick={() => setShowModal("program")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2042] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1a3466]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#c69214]" />
                  <span>Add Program</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f2042] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Program Name</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold text-center">Semesters</th>
                    <th className="px-4 py-3 font-semibold text-center">Batches</th>
                    <th className="px-4 py-3 font-semibold text-center">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No programs registered yet. Click &quot;Add Program&quot; to establish one.
                      </td>
                    </tr>
                  ) : (
                    programs.map((prog) => (
                      <tr key={prog.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-[#0f2042]">{prog.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{prog.name}</td>
                        <td className="px-4 py-3 text-slate-600">{prog.department?.name}</td>
                        <td className="px-4 py-3 text-center">{prog.totalSemesters}</td>
                        <td className="px-4 py-3 text-center">{prog._count?.batches || 0}</td>
                        <td className="px-4 py-3 text-center">{prog._count?.students || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ACADEMIC YEARS TAB */}
          {activeTab === "years" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Academic Calendar Years</h3>
                <button
                  onClick={() => setShowModal("academicYear")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2042] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1a3466]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#c69214]" />
                  <span>Add Academic Year</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f2042] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Academic Year</th>
                    <th className="px-4 py-3 font-semibold">Start Date</th>
                    <th className="px-4 py-3 font-semibold">End Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {academicYears.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No academic years configured yet.
                      </td>
                    </tr>
                  ) : (
                    academicYears.map((yr) => (
                      <tr key={yr.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{yr.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(yr.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(yr.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {yr.isCurrent ? (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Active Current Session
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BATCHES & SECTIONS TAB */}
          {activeTab === "batches" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Student Cohort Batches</h3>
                <button
                  onClick={() => setShowModal("batch")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2042] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1a3466]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#c69214]" />
                  <span>Add Batch</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f2042] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Batch Name</th>
                    <th className="px-4 py-3 font-semibold">Program</th>
                    <th className="px-4 py-3 font-semibold">Admission Year</th>
                    <th className="px-4 py-3 font-semibold text-center">Sections</th>
                    <th className="px-4 py-3 font-semibold text-center">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No student batches configured yet.
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{batch.name}</td>
                        <td className="px-4 py-3 text-slate-700">{batch.program?.name}</td>
                        <td className="px-4 py-3 text-slate-600">{batch.academicYear?.name}</td>
                        <td className="px-4 py-3 text-center">{batch._count?.sections || 0}</td>
                        <td className="px-4 py-3 text-center">{batch._count?.students || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUBJECTS TAB */}
          {activeTab === "subjects" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Course Subjects Directory</h3>
                <button
                  onClick={() => setShowModal("subject")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2042] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1a3466]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#c69214]" />
                  <span>Add Subject</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f2042] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Subject Code</th>
                    <th className="px-4 py-3 font-semibold">Subject Name</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold text-center">Type</th>
                    <th className="px-4 py-3 font-semibold text-center">Credits Configured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No course subjects registered yet.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-[#0f2042]">{sub.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="px-4 py-3 text-slate-600">{sub.department?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {sub.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sub.subjectCredits?.length > 0 ? (
                            <span className="text-emerald-700 font-bold">
                              {sub.subjectCredits.map((c: any) => `${c.credits} Cr`).join(", ")}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">
                {showModal === "department" && "Add New Department"}
                {showModal === "program" && "Add New Degree Program"}
                {showModal === "academicYear" && "Add Academic Calendar Year"}
                {showModal === "batch" && "Add Student Cohort Batch"}
                {showModal === "subject" && "Add Course Subject"}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Department Form */}
            {showModal === "department" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("department", deptForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Department Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                  <textarea
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#0f2042] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3466]"
                  >
                    {submitting ? "Saving..." : "Create Department"}
                  </button>
                </div>
              </form>
            )}

            {/* Program Form */}
            {showModal === "program" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("program", progForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Department</label>
                  <select
                    required
                    value={progForm.departmentId}
                    onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Program Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bachelor of Technology (CSE)"
                    value={progForm.name}
                    onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Program Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BTECH-CSE"
                    value={progForm.code}
                    onChange={(e) => setProgForm({ ...progForm, code: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={progForm.totalSemesters}
                    onChange={(e) =>
                      setProgForm({ ...progForm, totalSemesters: parseInt(e.target.value) || 8 })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#0f2042] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3466]"
                  >
                    {submitting ? "Saving..." : "Create Program"}
                  </button>
                </div>
              </form>
            )}

            {/* Academic Year Form */}
            {showModal === "academicYear" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("academicYear", yearForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Academic Year Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025-2026"
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      required
                      value={yearForm.startDate}
                      onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">End Date</label>
                    <input
                      type="date"
                      required
                      value={yearForm.endDate}
                      onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={yearForm.isCurrent}
                    onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                    className="rounded text-[#0f2042]"
                  />
                  <span className="text-xs text-slate-700">Set as Current Active Session</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#0f2042] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3466]"
                  >
                    {submitting ? "Saving..." : "Create Year"}
                  </button>
                </div>
              </form>
            )}

            {/* Batch Form */}
            {showModal === "batch" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("batch", batchForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Program</label>
                  <select
                    required
                    value={batchForm.programId}
                    onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">Select Program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Admission Academic Year</label>
                  <select
                    required
                    value={batchForm.academicYearId}
                    onChange={(e) => setBatchForm({ ...batchForm, academicYearId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">Select Year...</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Batch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 2023-2027"
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#0f2042] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3466]"
                  >
                    {submitting ? "Saving..." : "Create Batch"}
                  </button>
                </div>
              </form>
            )}

            {/* Subject Form */}
            {showModal === "subject" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("subject", subjectForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Department</label>
                  <select
                    required
                    value={subjectForm.departmentId}
                    onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-501"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database Management Systems"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="PROJECT">Project / Seminar</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#0f2042] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3466]"
                  >
                    {submitting ? "Saving..." : "Create Subject"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
