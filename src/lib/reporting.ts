import { prisma } from "@/lib/prisma";

export const REPORT_STATUSES = ["PENDING", "APPROVED", "ASSIGNED", "IN_PROGRESS", "REJECTED", "CANCELLED", "COMPLETED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportFilters = { from?: string; to?: string; status?: string; departmentId?: string; vehicleId?: string; driverId?: string };

export function buildVehicleRequestWhere(filters: ReportFilters) {
  const where: Record<string, unknown> = {};
  if (filters.from) where.departureDate = { ...(where.departureDate as Record<string, unknown> | undefined), gte: new Date(`${filters.from}T00:00:00.000Z`) };
  if (filters.to) where.departureDate = { ...(where.departureDate as Record<string, unknown> | undefined), lte: new Date(`${filters.to}T23:59:59.999Z`) };
  if (filters.status && REPORT_STATUSES.includes(filters.status as ReportStatus)) where.status = filters.status;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.driverId) where.driverId = filters.driverId;
  return where;
}

export async function getReportMasters() {
  const [departments, vehicles, drivers] = await Promise.all([
    prisma.department.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { nameTh: "asc" }], select: { publicId: true, code: true, nameTh: true, status: true } }),
    prisma.vehicle.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { licensePlate: "asc" }], select: { publicId: true, licensePlate: true, brand: true, model: true, status: true } }),
    prisma.driver.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { firstName: "asc" }, { lastName: "asc" }], select: { publicId: true, firstName: true, lastName: true, nickname: true, status: true } }),
  ]);
  return { departments, vehicles, drivers };
}

export const requestIncludes = {
  requester: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
  department: { select: { publicId: true, code: true, nameTh: true } },
  vehicle: { select: { publicId: true, licensePlate: true, brand: true, model: true, vehicleType: true } },
  driver: { select: { publicId: true, firstName: true, lastName: true, nickname: true } },
  evaluation: { select: { publicId: true, rating: true, feedback: true, acknowledgedAt: true, createdAt: true } },
  usageLog: { include: { fuelEntries: true, expenses: true } },
} as const;

export async function getVehicleRequests(filters: ReportFilters) {
  return prisma.vehicleRequest.findMany({ where: buildVehicleRequestWhere(filters), orderBy: [{ departureDate: "desc" }, { departureTime: "desc" }], include: requestIncludes });
}
export function displayRequester(request: Awaited<ReturnType<typeof getVehicleRequests>>[number]) { return request.requester?.nameTh || [request.requester?.firstnameTh, request.requester?.lastnameTh].filter(Boolean).join(" ") || "ไม่ระบุ"; }
export function displayVehicle(request: Awaited<ReturnType<typeof getVehicleRequests>>[number]) { return request.vehicle ? [request.vehicle.licensePlate, request.vehicle.brand, request.vehicle.model].filter(Boolean).join(" • ") : "-"; }
export function displayDriver(request: Awaited<ReturnType<typeof getVehicleRequests>>[number]) { return request.driver ? [request.driver.firstName, request.driver.lastName].filter(Boolean).join(" ") : "-"; }
