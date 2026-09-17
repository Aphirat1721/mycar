import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getReportMasters, getVehicleRequests } from "@/lib/reporting";

async function guard() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(["from", "to", "status", "departmentId", "vehicleId", "driverId"].flatMap((key) => {
    const value = searchParams.get(key);
    return value ? [[key, value]] : [];
  })) as Record<string, string>;
  const [rows, masters] = await Promise.all([getVehicleRequests(filters), getReportMasters()]);
  const grouped = masters.departments.map((department) => {
    const items = rows.filter((row) => row.department?.publicId === department.publicId);
    return {
      ...department,
      requestCount: items.length,
      pendingCount: items.filter((row) => row.status === "PENDING").length,
      approvedCount: items.filter((row) => row.status === "APPROVED").length,
      rejectedCount: items.filter((row) => row.status === "REJECTED").length,
      cancelledCount: items.filter((row) => row.status === "CANCELLED").length,
      completedCount: items.filter((row) => row.status === "COMPLETED").length,
      passengers: items.reduce((sum, row) => sum + row.passengerCount, 0),
    };
  }).filter((row) => row.requestCount > 0 || !searchParams.get("onlyUsed"));
  return NextResponse.json({ rows: grouped });
}
