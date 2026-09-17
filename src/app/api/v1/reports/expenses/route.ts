import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { buildVehicleRequestWhere } from "@/lib/reporting";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(["from", "to", "status", "departmentId", "vehicleId", "driverId"].flatMap((key) => { const value = searchParams.get(key); return value ? [[key, value]] : []; })) as Record<string, string>;
  const requests = await prisma.vehicleRequest.findMany({ where: buildVehicleRequestWhere(filters), orderBy: [{ departureDate: "desc" }, { departureTime: "desc" }], include: { vehicle: { select: { licensePlate: true, brand: true, model: true } }, driver: { select: { firstName: true, lastName: true } }, department: { select: { nameTh: true } }, usageLog: { include: { fuelEntries: true, expenses: true } } } });
  const rows = requests.filter((r) => r.usageLog).map((r) => ({
    publicId: r.publicId, departureDate: r.departureDate, vehicle: [r.vehicle?.licensePlate, r.vehicle?.brand, r.vehicle?.model].filter(Boolean).join(" ") || "-", driver: [r.driver?.firstName, r.driver?.lastName].filter(Boolean).join(" ") || "-", department: r.department?.nameTh ?? "-",
    fuelLiters: r.usageLog!.fuelEntries.reduce((sum, x) => sum + Number(x.liters), 0), fuelAmount: r.usageLog!.fuelEntries.reduce((sum, x) => sum + Number(x.amount), 0), expenseAmount: r.usageLog!.expenses.reduce((sum, x) => sum + Number(x.amount), 0), totalAmount: r.usageLog!.fuelEntries.reduce((sum, x) => sum + Number(x.amount), 0) + r.usageLog!.expenses.reduce((sum, x) => sum + Number(x.amount), 0),
  }));
  return NextResponse.json({ supported: true, rows, totals: { fuel: rows.reduce((sum, x) => sum + x.fuelAmount, 0), expenses: rows.reduce((sum, x) => sum + x.expenseAmount, 0), total: rows.reduce((sum, x) => sum + x.totalAmount, 0), fuelLiters: rows.reduce((sum, x) => sum + x.fuelLiters, 0) } });
}
