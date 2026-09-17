import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import VehicleRequestApprovalList from "@/components/vehicle-request-approval-list";

const BANGKOK = "Asia/Bangkok";
function bangkokParts(date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return { year: Number(p.find(x => x.type === "year")?.value), month: Number(p.find(x => x.type === "month")?.value) - 1, day: Number(p.find(x => x.type === "day")?.value) };
}
function dateOnly(year: number, month: number, day: number) { return new Date(Date.UTC(year, month, day)); }

export const dynamic = "force-dynamic";

export default async function VehicleRequestApprovalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const allowed = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN", "VEHICLE_APPROVER"].includes(role.key));
  if (!allowed) redirect("/dashboard/vehicle-requests");

  const current = bangkokParts();
  const start = dateOnly(current.year, current.month, current.day - 365);
  const end = dateOnly(current.year, current.month, current.day + 16);
  const requests = await prisma.vehicleRequest.findMany({
    where: { departureDate: { gte: start, lt: end }, status: { in: ["PENDING", "APPROVED", "ASSIGNED", "IN_PROGRESS", "REJECTED", "CANCELLED", "COMPLETED"] } },
    orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
    include: {
      requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } },
      department: { select: { nameTh: true } },
      vehicle: { select: { licensePlate: true, brand: true, model: true } },
      driver: { select: { firstName: true, lastName: true, nickname: true } },
      usageLog: { select: { lockedAt: true, actualDepartureAt: true, actualReturnAt: true, odometerStart: true, odometerEnd: true } },
    },
  });

  const [vehicles, drivers, approvedAssignments] = await Promise.all([
    prisma.vehicle.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: [{ licensePlate: "asc" }], select: { id: true, publicId: true, licensePlate: true, brand: true, model: true } }),
    prisma.driver.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }], select: { id: true, publicId: true, firstName: true, lastName: true, nickname: true } }),
    prisma.vehicleRequest.findMany({ where: { status: { in: ["APPROVED", "ASSIGNED", "IN_PROGRESS"] }, OR: [{ vehicleId: { not: null } }, { driverId: { not: null } }] }, select: { vehicleId: true, driverId: true, departureAt: true, returnAt: true } }),
  ]);

  const availableVehiclesByRequest = Object.fromEntries(requests.filter(r => r.status === "PENDING").map(request => [request.publicId, vehicles.filter(vehicle => !approvedAssignments.some(a => a.vehicleId === vehicle.id && a.departureAt < request.returnAt && a.returnAt > request.departureAt)).map(vehicle => ({ id: vehicle.publicId, label: [vehicle.licensePlate, vehicle.brand, vehicle.model].filter(Boolean).join(" • ") || "ไม่ระบุรถ" }))]));
  const availableDriversByRequest = Object.fromEntries(requests.filter(r => r.status === "PENDING").map(request => [request.publicId, drivers.filter(driver => !approvedAssignments.some(a => a.driverId === driver.id && a.departureAt < request.returnAt && a.returnAt > request.departureAt)).map(driver => ({ id: driver.publicId, label: [driver.firstName, driver.lastName].filter(Boolean).join(" ") + (driver.nickname ? ` (${driver.nickname})` : "") }))]));

  return <div className="space-y-7"><div><p className="text-sm font-semibold text-teal-700">งานอนุมัติ</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">อนุมัติคำขอใช้รถ</h1><p className="mt-2 text-sm text-slate-500">รายการย้อนหลัง 1 ปีและล่วงหน้า 15 วัน • ตรวจสอบรายละเอียด สถานะ และจัดสรรรถ/พนักงานขับรถ</p></div><VehicleRequestApprovalList initialRequests={requests} vehiclesByRequest={availableVehiclesByRequest} driversByRequest={availableDriversByRequest} /></div>;
}
