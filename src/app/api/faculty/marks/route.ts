import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { Role, ExamStatus } from "@prisma/client";
import { assertFaculty } from "@/lib/auth/rbac";
import { ExaminationService } from "@/services/examination.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const examinationSubjectId = searchParams.get("examinationSubjectId");
    const subjectId = searchParams.get("subjectId");
    const sectionId = searchParams.get("sectionId");
    const semesterId = searchParams.get("semesterId");

    let targetExamSubjectId = examinationSubjectId;

    if (!targetExamSubjectId && subjectId && sectionId && semesterId) {
      // Find the active examination subject matching this subject and semester
      const examSubject = await prisma.examinationSubject.findFirst({
        where: {
          subjectId,
          examination: {
            semesterId,
            status: { in: [ExamStatus.MARKS_ENTRY, ExamStatus.UNDER_REVIEW, ExamStatus.IN_PROGRESS] },
          },
        },
        include: {
          examination: true,
        },
      });

      if (!examSubject) {
        return NextResponse.json(
          { error: "No active examination found for this course section" },
          { status: 404 }
        );
      }
      targetExamSubjectId = examSubject.id;
    }

    if (!targetExamSubjectId) {
      return NextResponse.json(
        { error: "Examination subject ID or course section parameters required" },
        { status: 400 }
      );
    }

    // Retrieve examination subject
    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: targetExamSubjectId },
      include: {
        subject: true,
        examination: {
          include: {
            program: true,
            semester: true,
            academicYear: true,
          },
        },
      },
    });

    if (!examSubject) {
      return NextResponse.json({ error: "Exam subject not found" }, { status: 404 });
    }

    // Verify faculty assignment if requester is faculty
    if (session.user.role === Role.FACULTY) {
      assertFaculty(session.user);
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: session.user.facultyId!,
          subjectId: examSubject.subjectId,
          semesterId: examSubject.examination.semesterId,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to instruct this subject" },
          { status: 403 }
        );
      }
    }

    // Fetch enrolled students snapshot for this examination
    const enrollments = await prisma.examinationEnrollment.findMany({
      where: { examinationId: examSubject.examinationId },
      orderBy: { rollNumberSnapshot: "asc" },
    });

    // Fetch existing marks entered for this exam subject
    const existingMarks = await prisma.mark.findMany({
      where: { examinationSubjectId: examSubject.id },
    });

    const marksMap = new Map(existingMarks.map((m) => [m.examinationEnrollmentId, m]));

    const roster = enrollments.map((enr) => {
      const mark = marksMap.get(enr.id);
      return {
        enrollmentId: enr.id,
        rollNumber: enr.rollNumberSnapshot,
        regNumber: enr.regNumberSnapshot,
        studentName: enr.studentNameSnapshot,
        section: enr.sectionSnapshot,
        internalMarks: mark?.internalMarks ?? null,
        externalMarks: mark?.externalMarks ?? null,
        totalMarks: mark?.totalMarks ?? null,
        isAbsent: mark?.totalMarks === 0 && mark?.internalMarks === 0 && mark?.externalMarks === 0,
        isWithheld: mark?.status === "WITHHELD",
        status: mark?.status ?? "DRAFT",
        feedback: mark?.rejectionReason ?? null,
      };
    });

    return NextResponse.json({
      examSubject: {
        id: examSubject.id,
        subjectCode: examSubject.subject.code,
        subjectName: examSubject.subject.name,
        maxInternalMarks: examSubject.maxInternalMarks,
        maxExternalMarks: examSubject.maxExternalMarks,
        passingMarks: examSubject.minTotalMarks,
        examinationTitle: examSubject.examination.title,
        program: examSubject.examination.program.name,
        semester: examSubject.examination.semester.title,
        academicYear: examSubject.examination.academicYear.name,
        examStatus: examSubject.examination.status,
      },
      roster,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.FACULTY && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = await ExaminationService.enterMarks(session.user, body);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to enter marks";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
