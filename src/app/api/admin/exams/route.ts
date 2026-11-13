import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ExaminationService } from "@/services/examination.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const { searchParams } = new URL(request.url);
    const examinationId = searchParams.get("id");

    if (examinationId) {
      const exam = await prisma.examination.findUnique({
        where: { id: examinationId },
        include: {
          program: true,
          semester: true,
          academicYear: true,
          publication: true,
          examSubjects: {
            include: {
              subject: true,
              marks: {
                include: {
                  examinationEnrollment: true,
                },
              },
            },
          },
          enrollments: {
            orderBy: { rollNumberSnapshot: "asc" },
          },
        },
      });

      if (!exam) {
        return NextResponse.json({ error: "Examination not found" }, { status: 404 });
      }

      const gateCheck = await ExaminationService.validatePrePublicationGates(exam.id);

      return NextResponse.json({ exam, gateCheck });
    }

    // List all exams
    const exams = await prisma.examination.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        program: true,
        semester: true,
        academicYear: true,
        publication: true,
        _count: {
          select: {
            examSubjects: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(exams);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const body = await request.json();
    const { action, data } = body;

    let result;
    switch (action) {
      case "create":
        result = await ExaminationService.createExamination(session.user, data);
        break;
      case "addSubject":
        result = await ExaminationService.addExaminationSubject(session.user, data);
        break;
      case "freezeRoster":
        result = await ExaminationService.freezeEnrollmentRoster(session.user, data.examinationId);
        break;
      case "reviewMarks":
        result = await ExaminationService.reviewMarks(session.user, data);
        break;
      case "validateGates":
        result = await ExaminationService.validatePrePublicationGates(data.examinationId);
        break;
      default:
        return NextResponse.json({ error: `Unknown examination action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Operation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
