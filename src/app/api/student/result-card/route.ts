import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { StudentResultService } from "@/services/student-result.service";
import { assertStudent } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    assertStudent(session.user);

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json(
        { error: "Examination ID parameter is required" },
        { status: 400 }
      );
    }

    const pdfBytes = await StudentResultService.getResultCardPdf(session.user, {
      studentId: session.user.studentId!,
      examinationId: examId,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SRGC_Transcript_${session.user.identifier}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate result card PDF";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
