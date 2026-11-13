import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { parseMarksCsv, parseMarksXlsx } from "@/lib/import/marks-importer";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.FACULTY && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const examinationSubjectId = formData.get("examinationSubjectId") as string | null;

    if (!file || !examinationSubjectId) {
      return NextResponse.json(
        { error: "File and examinationSubjectId are required" },
        { status: 400 }
      );
    }

    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: examinationSubjectId },
      include: { examination: true },
    });

    if (!examSubject) {
      return NextResponse.json(
        { error: "Examination subject not found" },
        { status: 404 }
      );
    }

    const enrollments = await prisma.examinationEnrollment.findMany({
      where: { examinationId: examSubject.examinationId },
    });

    const enrollmentByRoll = new Map(
      enrollments.map((enr) => [enr.rollNumberSnapshot.trim().toUpperCase(), enr])
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const parsed = isXlsx ? await parseMarksXlsx(buffer) : parseMarksCsv(buffer);

    const matchedMarks: Array<{
      examinationEnrollmentId: string;
      rollNumber: string;
      studentName: string;
      internalMarks: number | null;
      externalMarks: number | null;
      isAbsent: boolean;
      isWithheld: boolean;
    }> = [];

    const validationErrors = [...parsed.errors];

    for (const row of parsed.rows) {
      const rollKey = row.rollNumber.trim().toUpperCase();
      const enrollment = enrollmentByRoll.get(rollKey);

      if (!enrollment) {
        validationErrors.push({
          rowNumber: row.rowNumber,
          rawContent: JSON.stringify(row),
          message: `Student with Roll Number "${row.rollNumber}" is not enrolled in this examination session.`,
        });
        continue;
      }

      // Check max marks boundaries
      if (
        row.internalMarks !== null &&
        row.internalMarks !== undefined &&
        row.internalMarks > examSubject.maxInternalMarks
      ) {
        validationErrors.push({
          rowNumber: row.rowNumber,
          rawContent: JSON.stringify(row),
          message: `Internal marks (${row.internalMarks}) exceed maximum permitted (${examSubject.maxInternalMarks}).`,
        });
        continue;
      }

      if (
        row.externalMarks !== null &&
        row.externalMarks !== undefined &&
        row.externalMarks > examSubject.maxExternalMarks
      ) {
        validationErrors.push({
          rowNumber: row.rowNumber,
          rawContent: JSON.stringify(row),
          message: `External marks (${row.externalMarks}) exceed maximum permitted (${examSubject.maxExternalMarks}).`,
        });
        continue;
      }

      matchedMarks.push({
        examinationEnrollmentId: enrollment.id,
        rollNumber: enrollment.rollNumberSnapshot,
        studentName: enrollment.studentNameSnapshot,
        internalMarks: row.internalMarks ?? null,
        externalMarks: row.externalMarks ?? null,
        isAbsent: row.isAbsent ?? false,
        isWithheld: row.isWithheld ?? false,
      });
    }

    return NextResponse.json({
      previewCount: matchedMarks.length,
      matchedMarks,
      errorCount: validationErrors.length,
      errors: validationErrors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

