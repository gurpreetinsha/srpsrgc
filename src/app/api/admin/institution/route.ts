import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { assertAdmin } from "@/lib/auth/rbac";
import { InstitutionService } from "@/services/institution.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const settings = await InstitutionService.getSettings();
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    assertAdmin(session.user);

    const body = await request.json();
    const updated = await InstitutionService.updateSettings(session.user, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Validation / Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

