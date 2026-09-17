import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getVehicleRequests } from "@/lib/reporting";

const labels: Record<string, string> = { PENDING: "รอพิจารณา", APPROVED: "อนุมัติ", REJECTED: "ไม่อนุมัติ", CANCELLED: "ยกเลิก", COMPLETED: "เสร็จสิ้น" };

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
  const rows = await getVehicleRequests(filters);
  const byStatus = Object.fromEntries(Object.entries(labels).map(([key, label]) => [key, { key, label, count: rows.filter((row) => row.status === key).length }]));
  const byMonth = new Map<string, { month: string; count: number }>();
  for (const row of rows) {
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).format(row.departureDate);
    const current = byMonth.get(month) ?? { month, count: 0 };
    current.count += 1;
    byMonth.set(month, current);
  }
  return NextResponse.json({ total: rows.length, byStatus: Object.values(byStatus), byMonth: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)) });
}
