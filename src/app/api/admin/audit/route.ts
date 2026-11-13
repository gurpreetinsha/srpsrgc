import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { AuditExplorerService } from "@/services/audit-explorer.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    const result = await AuditExplorerService.queryLogs(session.user, {
      action,
      entityType,
      userId,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

