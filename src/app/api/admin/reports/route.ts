import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { ReportService } from "@/services/report.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const { searchParams } = new URL(request.url);
    const examinationId = searchParams.get("examinationId");

    if (!examinationId) {
      return NextResponse.json(
        { error: "Query parameter examinationId is required" },
        { status: 400 }
      );
    }

    const report = await ReportService.getExamPerformanceReport(session.user, examinationId);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

