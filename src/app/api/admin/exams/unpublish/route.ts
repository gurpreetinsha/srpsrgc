import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { ExaminationService } from "@/services/examination.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const body = await request.json();
    const result = await ExaminationService.unpublishResults(session.user, body);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unpublish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

