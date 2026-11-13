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
    const format = searchParams.get("format") || "csv";

    if (!examinationId) {
      return NextResponse.json(
        { error: "Query parameter examinationId is required" },
        { status: 400 }
      );
    }

    if (format === "xlsx") {
      const buffer = await ReportService.exportExamRosterXlsx(session.user, examinationId);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="SRGC_Results_${examinationId}.xlsx"`,
        },
      });
    }

    const csv = await ReportService.exportExamRosterCsv(session.user, examinationId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="SRGC_Results_${examinationId}.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
