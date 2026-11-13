import { getCurrentSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FacultyDashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user.facultyId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-bold">Faculty Profile Required</h2>
        <p className="mt-1 text-sm">
          No faculty instructor profile is associated with account identifier ({session?.user.identifier}).
          Please contact the College Administrator to establish teaching assignments.
        </p>
      </div>
    );
  }

  const assignments = await prisma.facultyAssignment.findMany({
    where: { facultyId: session.user.facultyId },
    include: {
      subject: true,
      section: { include: { batch: { include: { program: true } } } },
      semester: true,
      academicYear: true,
    },
    orderBy: { assignedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#0f2042]">
          Assigned Course Sections
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Official instructor assignments for marks entry, moderation, and grade submissions.
        </p>
      </div>

      {/* Assignment Grid */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">No Course Assignments Active</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            You do not have any active course sections assigned for this semester.
            Contact your Department Head to receive your course assignments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((asgn) => (
            <div
              key={asgn.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0f2042]/50 hover:shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#0f2042]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0f2042]">
                    {asgn.subject.code}
                  </span>
                  <span className="text-[11px] font-semibold text-[#c69214]">
                    {asgn.role} Instructor
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {asgn.subject.name}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div>
                    <span className="font-medium text-slate-700">Program: </span>
                    {asgn.section.batch.program.name}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Class: </span>
                    {asgn.semester.title} — {asgn.section.name}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Academic Year: </span>
                    {asgn.academicYear.name}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  href={`/faculty/marks?subjectId=${asgn.subjectId}&sectionId=${asgn.sectionId}&semesterId=${asgn.semesterId}`}
                  className="flex items-center justify-between rounded-lg bg-[#0f2042] px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#1a3466]"
                >
                  <span>Enter / Import Marks</span>
                  <ArrowRight className="h-4 w-4 text-[#c69214]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
