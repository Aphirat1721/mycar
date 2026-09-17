import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getVehicleRequests, displayRequester, displayVehicle, displayDriver } from "@/lib/reporting";

async function guard() { const user = await getCurrentUser(); if (!user) return { response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) }; const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key)); if (!isAdmin) return { response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) }; return { user }; }
export async function GET(request: NextRequest) {
  const auth = await guard(); if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url); const filters = Object.fromEntries(["from","to","status","departmentId","vehicleId","driverId"].flatMap((key) => { const value=searchParams.get(key); return value ? [[key,value]] : []; })) as Record<string,string>;
  const requests = await getVehicleRequests(filters);
  const rows = requests.map((r) => ({ publicId:r.publicId, departureDate:r.departureDate, returnDate:r.returnDate, requester:displayRequester(r), department:r.department?.nameTh ?? "-", destination:r.destination, purpose:r.purpose, vehicle:displayVehicle(r), driver:displayDriver(r), passengerCount:r.passengerCount, actualDepartureAt:r.usageLog?.actualDepartureAt ?? null, actualReturnAt:r.usageLog?.actualReturnAt ?? null, distanceKm:r.usageLog?.odometerEnd != null ? r.usageLog.odometerEnd-r.usageLog.odometerStart : null, status:r.status }));
  return NextResponse.json({ rows });
}
