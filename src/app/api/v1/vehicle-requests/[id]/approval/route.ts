import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import type { VehicleRequestStatus } from "@/generated/prisma/client";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT", "CANCEL", "UNAPPROVE"]), reason: z.string().trim().max(2000).optional().or(z.literal("")), vehicleId: z.string().uuid().optional(), driverId: z.string().uuid().optional() }).superRefine((value, ctx) => { if (value.action === "APPROVE") { if (!value.vehicleId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicleId"], message: "กรุณาเลือกรถ" }); if (!value.driverId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["driverId"], message: "กรุณาเลือกพนักงานขับรถ" }); } });
function canApprove(user: Awaited<ReturnType<typeof requireUser>>) { return user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN", "VEHICLE_APPROVER"].includes(role.key)); }
const allocatedStatuses: { in: VehicleRequestStatus[] } = { in: ["ASSIGNED", "IN_PROGRESS"] };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canApprove(user)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await params;
    const body = schema.parse(await request.json());
    const current = await prisma.vehicleRequest.findUnique({ where: { publicId: id }, select: { id: true, publicId: true, status: true, departureAt: true, returnAt: true, vehicleId: true, driverId: true } });
    if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (body.action === "UNAPPROVE") {
      if (!["ASSIGNED", "APPROVED"].includes(current.status)) return NextResponse.json({ error: "คำขอนี้ยังไม่ได้อยู่ในสถานะจัดรถแล้ว" }, { status: 409 });
      const updated = await prisma.vehicleRequest.update({ where: { id: current.id }, data: { status: "PENDING", vehicleId: null, driverId: null } });
      await audit({ userId: user.id, action: "UNAPPROVE_VEHICLE_REQUEST", resource: "VEHICLE_REQUEST", resourceId: current.publicId, result: "SUCCESS", metadata: { previousVehicleId: current.vehicleId, previousDriverId: current.driverId, reason: body.reason || null } });
      return NextResponse.json({ data: updated });
    }

    if (current.status !== "PENDING") return NextResponse.json({ error: "เฉพาะคำขอที่รอพิจารณาเท่านั้นที่สามารถอนุมัติ ไม่อนุมัติ หรือยกเลิกได้" }, { status: 409 });
    if (body.action === "CANCEL") {
      const updated = await prisma.vehicleRequest.update({ where: { id: current.id }, data: { status: "CANCELLED", vehicleId: null, driverId: null } });
      await audit({ userId: user.id, action: "CANCEL_VEHICLE_REQUEST", resource: "VEHICLE_REQUEST", resourceId: current.publicId, result: "SUCCESS", metadata: { reason: body.reason || null } });
      return NextResponse.json({ data: updated });
    }
    if (body.action === "APPROVE") {
      const [vehicle, driver] = await Promise.all([
        prisma.vehicle.findFirst({ where: { publicId: body.vehicleId!, deletedAt: null, status: "ACTIVE" }, select: { id: true } }),
        prisma.driver.findFirst({ where: { publicId: body.driverId!, deletedAt: null, status: "ACTIVE" }, select: { id: true } }),
      ]);
      if (!vehicle) return NextResponse.json({ error: "รถที่เลือกไม่พร้อมใช้งาน" }, { status: 400 });
      if (!driver) return NextResponse.json({ error: "พนักงานขับรถที่เลือกไม่พร้อมใช้งาน" }, { status: 400 });
      const [vehicleConflict, driverConflict] = await Promise.all([
        prisma.vehicleRequest.findFirst({ where: { status: allocatedStatuses, vehicleId: vehicle.id, departureAt: { lt: current.returnAt }, returnAt: { gt: current.departureAt } }, select: { publicId: true } }),
        prisma.vehicleRequest.findFirst({ where: { status: allocatedStatuses, driverId: driver.id, departureAt: { lt: current.returnAt }, returnAt: { gt: current.departureAt } }, select: { publicId: true } }),
      ]);
      if (vehicleConflict) return NextResponse.json({ error: "รถคันนี้ถูกจัดสรรให้คำขออื่นในช่วงวันและเวลาเดียวกันแล้ว กรุณาเลือกรถคันอื่น" }, { status: 409 });
      if (driverConflict) return NextResponse.json({ error: "พนักงานขับรถคนนี้ถูกจัดสรรให้คำขออื่นในช่วงวันและเวลาเดียวกันแล้ว กรุณาเลือกพนักงานขับรถคนอื่น" }, { status: 409 });
      const updated = await prisma.vehicleRequest.update({ where: { id: current.id }, data: { status: "ASSIGNED", vehicleId: vehicle.id, driverId: driver.id } });
      await audit({ userId: user.id, action: "ASSIGN_VEHICLE_REQUEST", resource: "VEHICLE_REQUEST", resourceId: current.publicId, result: "SUCCESS", metadata: { reason: body.reason || null, vehicleId: body.vehicleId, driverId: body.driverId } });
      return NextResponse.json({ data: updated });
    }
    const updated = await prisma.vehicleRequest.update({ where: { id: current.id }, data: { status: "REJECTED" } });
    await audit({ userId: user.id, action: "REJECT_VEHICLE_REQUEST", resource: "VEHICLE_REQUEST", resourceId: current.publicId, result: "SUCCESS", metadata: { reason: body.reason || null } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลการดำเนินการไม่ถูกต้อง" }, { status: 400 });
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
