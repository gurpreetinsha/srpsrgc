import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { PeopleService } from "@/services/people.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "students";
    const search = searchParams.get("search") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (type === "faculty") {
      const data = await PeopleService.listFaculty({ departmentId, search });
      return NextResponse.json(data);
    }

    const data = await PeopleService.listStudents({
      programId,
      search,
      page,
      pageSize,
    });
    return NextResponse.json(data);
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
      case "student":
        result = await PeopleService.createStudent(session.user, data);
        break;
      case "faculty":
        result = await PeopleService.createFaculty(session.user, data);
        break;
      case "enroll":
        result = await PeopleService.enrollStudent(session.user, data);
        break;
      case "assign":
        result = await PeopleService.assignFaculty(session.user, data);
        break;
      default:
        return NextResponse.json({ error: `Unknown people action: ${type}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Creation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

