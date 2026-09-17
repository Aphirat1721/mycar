import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getVehicleRequests, getReportMasters } from "@/lib/reporting";

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
  const grouped = masters.vehicles.map((vehicle) => {
    const vehicleRows = rows.filter((row) => row.vehicle?.publicId === vehicle.publicId);
    const completed = vehicleRows.filter((row) => row.status === "COMPLETED").length;
    return {
      ...vehicle,
      tripCount: vehicleRows.length,
      completedCount: completed,
      approvedCount: vehicleRows.filter((row) => row.status === "APPROVED").length,
      cancelledCount: vehicleRows.filter((row) => row.status === "CANCELLED").length,
      passengers: vehicleRows.reduce((sum, row) => sum + row.passengerCount, 0),
    };
  }).filter((row) => row.tripCount > 0 || !searchParams.get("onlyUsed"));
  return NextResponse.json({ rows: grouped });
}
