import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getReportMasters } from "@/lib/reporting";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
    if (!isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json(await getReportMasters());
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลตัวกรองได้" }, { status: 500 });
  }
}
