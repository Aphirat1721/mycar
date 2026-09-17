import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getVehicleRequests } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
  if (!isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(["from", "to", "status", "departmentId", "vehicleId", "driverId"].flatMap((key) => {
    const value = searchParams.get(key);
    return value ? [[key, value]] : [];
  })) as Record<string, string>;
  const rows = await getVehicleRequests(filters);
  const counts = rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, { total: 0 } as Record<string, number>);
  return NextResponse.json({ rows, counts });
}
