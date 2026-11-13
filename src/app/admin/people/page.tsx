"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  UserPlus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PeopleManagementPage() {
  const [activeTab, setActiveTab] = useState<"students" | "faculty">("students");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [faculty, setFaculty] = useState<any[]>([]);

  // Metadata for dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  // Modals
  const [showModal, setShowModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [studentForm, setStudentForm] = useState({
    rollNumber: "",
    regNumber: "",
    firstName: "",
    lastName: "",
    gender: "MALE",
    contactEmail: "",
    contactPhone: "",
    programId: "",
    batchId: "",
  });

  const [facultyForm, setFacultyForm] = useState({
    facultyCode: "",
    firstName: "",
    lastName: "",
    designation: "Assistant Professor",
    departmentId: "",
    contactEmail: "",
    contactPhone: "",
  });

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/admin/academic");
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
        setPrograms(data.programs || []);
        setBatches(data.batches || []);
      }
    } catch {
      // non-critical
    }
  };

  const loadStudents = async (p = 1, s = "") => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/people?type=students&page=${p}&pageSize=15&search=${encodeURIComponent(s)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load students");

      setStudents(data.items || []);
      setTotalStudents(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading students");
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async (s = "") => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/people?type=faculty&search=${encodeURIComponent(s)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load faculty");

      setFaculty(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === "students") {
      loadStudents(page, search);
    } else {
      loadFaculty(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "students") {
      setPage(1);
      loadStudents(1, search);
    } else {
      loadFaculty(search);
    }
  };

  const handleCreate = async (type: string, data: any) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || `Failed to create ${type}`);

      setSuccess(`Successfully registered ${type}. User credentials created automatically.`);
      setShowModal(null);

      if (type === "student") {
        await loadStudents(page, search);
      } else {
        await loadFaculty(search);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#991b1b]">
            Students & Faculty Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain institutional personnel directories, student profiles, and teaching staff accounts.
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

      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tab switch */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          <button
            onClick={() => {
              setActiveTab("students");
              setSearch("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === "students"
                ? "bg-[#991b1b] text-white shadow"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-[#991b1b]"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Students Directory ({totalStudents})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("faculty");
              setSearch("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === "faculty"
                ? "bg-[#991b1b] text-white shadow"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-[#991b1b]"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Faculty Directory ({faculty.length})</span>
          </button>
        </div>

        {/* Search & New Button */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 sm:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === "students" ? "Search Roll / Name..." : "Search Code / Name..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-[#991b1b] focus:outline-none"
              />
            </div>
          </form>

          <button
            onClick={() => setShowModal(activeTab === "students" ? "student" : "faculty")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#991b1b] px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#7f1d1d]"
          >
            <UserPlus className="h-3.5 w-3.5 text-white" />
            <span>{activeTab === "students" ? "Add Student" : "Add Faculty"}</span>
          </button>
        </div>
      </div>

      {/* Directory Tables */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#991b1b] border-t-transparent"></div>
        </div>
      ) : activeTab === "students" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-[#991b1b] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Roll Number</th>
                  <th className="px-4 py-3 font-semibold">Reg Number</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No students found. Use &quot;Add Student&quot; to register candidates.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-[#991b1b]">{st.rollNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{st.regNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{st.program?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{st.batch?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <div>
              Showing page {page} of {totalPages} ({totalStudents} total students)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-slate-300 bg-white p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-slate-300 bg-white p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-[#991b1b] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Faculty Code</th>
                  <th className="px-4 py-3 font-semibold">Instructor Name</th>
                  <th className="px-4 py-3 font-semibold">Designation</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold text-center">Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No faculty instructors found.
                    </td>
                  </tr>
                ) : (
                  faculty.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-[#991b1b]">{f.facultyCode}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {f.firstName} {f.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{f.designation}</td>
                      <td className="px-4 py-3 text-slate-700">{f.department?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{f.contactEmail || "-"}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {f._count?.assignments || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">
                {showModal === "student" ? "Register New Student" : "Register Faculty Instructor"}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Student Registration Form */}
            {showModal === "student" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("student", studentForm);
                }}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 23CSE001"
                      value={studentForm.rollNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Reg Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. REG2023001"
                      value={studentForm.regNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Degree Program</label>
                  <select
                    required
                    value={studentForm.programId}
                    onChange={(e) => setStudentForm({ ...studentForm, programId: e.target.value })}
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
                  <label className="text-xs font-bold text-slate-700">Batch Cohort</label>
                  <select
                    required
                    value={studentForm.batchId}
                    onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">Select Batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Email (Optional)</label>
                  <input
                    type="email"
                    value={studentForm.contactEmail}
                    onChange={(e) => setStudentForm({ ...studentForm, contactEmail: e.target.value })}
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
                    className="rounded bg-[#991b1b] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7f1d1d]"
                  >
                    {submitting ? "Saving..." : "Create Student Account"}
                  </button>
                </div>
              </form>
            )}

            {/* Faculty Registration Form */}
            {showModal === "faculty" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate("faculty", facultyForm);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700">Faculty Code / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-CSE-101"
                    value={facultyForm.facultyCode}
                    onChange={(e) => setFacultyForm({ ...facultyForm, facultyCode: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.firstName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, firstName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.lastName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, lastName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Department</label>
                  <select
                    required
                    value={facultyForm.departmentId}
                    onChange={(e) => setFacultyForm({ ...facultyForm, departmentId: e.target.value })}
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
                  <label className="text-xs font-bold text-slate-700">Designation</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.designation}
                    onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={facultyForm.contactEmail}
                    onChange={(e) => setFacultyForm({ ...facultyForm, contactEmail: e.target.value })}
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
                    className="rounded bg-[#991b1b] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7f1d1d]"
                  >
                    {submitting ? "Saving..." : "Create Faculty Account"}
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
