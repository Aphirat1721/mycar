import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/session";
import { getUserApplications } from "@/modules/portal/applications";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const applications = await getUserApplications(user.id);
  return NextResponse.json({ data: applications });
}
