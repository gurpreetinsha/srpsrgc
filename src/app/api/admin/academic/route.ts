import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { AcademicService } from "@/services/academic.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const programId = searchParams.get("programId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    if (type === "departments") {
      const data = await AcademicService.listDepartments();
      return NextResponse.json(data);
    }
    if (type === "programs") {
      const data = await AcademicService.listPrograms(departmentId);
      return NextResponse.json(data);
    }
    if (type === "academicYears") {
      const data = await AcademicService.listAcademicYears();
      return NextResponse.json(data);
    }
    if (type === "batches") {
      const data = await AcademicService.listBatches(programId);
      return NextResponse.json(data);
    }
    if (type === "subjects") {
      const data = await AcademicService.listSubjects(departmentId);
      return NextResponse.json(data);
    }

    // Default "all": fetch core academic metadata
    const [departments, programs, academicYears, batches, subjects] = await Promise.all([
      AcademicService.listDepartments(),
      AcademicService.listPrograms(),
      AcademicService.listAcademicYears(),
      AcademicService.listBatches(),
      AcademicService.listSubjects(),
    ]);

    return NextResponse.json({
      departments,
      programs,
      academicYears,
      batches,
      subjects,
    });
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
    const { type, data } = body;

    let result;
    switch (type) {
      case "department":
        result = await AcademicService.createDepartment(session.user, data);
        break;
      case "program":
        result = await AcademicService.createProgram(session.user, data);
        break;
      case "academicYear":
        result = await AcademicService.createAcademicYear(session.user, data);
        break;
      case "batch":
        result = await AcademicService.createBatch(session.user, data);
        break;
      case "section":
        result = await AcademicService.createSection(session.user, data);
        break;
      case "subject":
        result = await AcademicService.createSubject(session.user, data);
        break;
      case "credit":
        result = await AcademicService.configureSubjectCredit(session.user, data);
        break;
      default:
        return NextResponse.json({ error: `Unknown academic entity type: ${type}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create academic entity";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

