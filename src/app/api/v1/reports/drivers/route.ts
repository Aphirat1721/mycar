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
  const grouped = masters.drivers.map((driver) => {
    const items = rows.filter((row) => row.driver?.publicId === driver.publicId);
    const rated = items.filter((row) => row.evaluation?.rating != null);
    const averageRating = rated.length ? rated.reduce((sum, row) => sum + (row.evaluation?.rating ?? 0), 0) / rated.length : null;
    return {
      ...driver,
      tripCount: items.length,
      completedCount: items.filter((row) => row.status === "COMPLETED").length,
      approvedCount: items.filter((row) => row.status === "APPROVED").length,
      cancelledCount: items.filter((row) => row.status === "CANCELLED").length,
      passengers: items.reduce((sum, row) => sum + row.passengerCount, 0),
      evaluationCount: rated.length,
      averageRating: averageRating == null ? null : Number(averageRating.toFixed(2)),
    };
  }).filter((row) => row.tripCount > 0 || !searchParams.get("onlyUsed"));
  return NextResponse.json({ rows: grouped });
}
