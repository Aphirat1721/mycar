import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const checkSchema = z.object({
  fuel: z.boolean().default(true),
  tires: z.boolean().default(true),
  lights: z.boolean().default(true),
  coolant: z.boolean().default(true),
  brakes: z.boolean().default(true),
  general: z.boolean().default(true),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});
const fuelSchema = z.object({ fuelType: z.string().trim().min(1).max(100), liters: z.coerce.number().positive().max(10000), pricePerLiter: z.coerce.number().nonnegative().max(10000).optional().nullable(), amount: z.coerce.number().nonnegative().max(10000000), receiptNo: z.string().trim().max(120).optional().or(z.literal("")), note: z.string().trim().max(2000).optional().or(z.literal("")) });
const expenseSchema = z.object({ type: z.string().trim().min(1).max(100), amount: z.coerce.number().positive().max(10000000), detail: z.string().trim().max(2000).optional().or(z.literal("")), receiptNo: z.string().trim().max(120).optional().or(z.literal("")), evidencePath: z.string().trim().max(2000).optional().or(z.literal("")) });
const schema = z.object({
  actualDepartureAt: z.string().datetime().optional(),
  actualReturnAt: z.string().datetime().optional(),
  odometerStart: z.coerce.number().int().min(0).max(9999999),
  odometerEnd: z.coerce.number().int().min(0).max(9999999).optional(),
  preTripCheck: checkSchema.optional(), postTripCheck: checkSchema.optional(),
  hasIncident: z.boolean().default(false), incidentDetail: z.string().trim().max(5000).optional().or(z.literal("")),
  operationNote: z.string().trim().max(5000).optional().or(z.literal("")),
  fuelEntries: z.array(fuelSchema).max(30).default([]), expenses: z.array(expenseSchema).max(50).default([]),
}).superRefine((v, ctx) => {
  if (v.actualDepartureAt && v.actualReturnAt && new Date(v.actualReturnAt) <= new Date(v.actualDepartureAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["actualReturnAt"], message: "เวลากลับจริงต้องมากกว่าเวลาออกจริง" });
  if (v.odometerEnd !== undefined && v.odometerEnd < v.odometerStart) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["odometerEnd"], message: "เลขไมล์กลับต้องไม่น้อยกว่าเลขไมล์ก่อนออก" });
  if (v.hasIncident && !v.incidentDetail) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["incidentDetail"], message: "กรุณาระบุรายละเอียดเหตุการณ์/อุบัติเหตุ" });
});

async function driverForUser(userId: string) { return prisma.driver.findUnique({ where: { userId }, select: { id: true, publicId: true, firstName: true, lastName: true, status: true, deletedAt: true } }); }

async function loadRequest(publicId: string) {
  return prisma.vehicleRequest.findUnique({ where: { publicId }, include: { requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { nameTh: true } }, vehicle: { select: { licensePlate: true, brand: true, model: true } }, driver: { select: { id: true, publicId: true, firstName: true, lastName: true, nickname: true } }, usageLog: { include: { fuelEntries: true, expenses: true } } } });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const item = await loadRequest(id);
    if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const driver = await driverForUser(user.id);
    const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
    if (!isAdmin && (!driver || item.driverId !== driver.id)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ data: item });
  } catch (error) { const forbidden = error instanceof Error && error.message === "FORBIDDEN"; return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const item = await loadRequest(id);
    if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const driver = await driverForUser(user.id);
    const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
    if (!driver || driver.status !== "ACTIVE" || driver.deletedAt || item.driverId !== driver.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(item.status)) return NextResponse.json({ error: "ภารกิจนี้ยังไม่อยู่ในสถานะที่บันทึกการใช้รถได้" }, { status: 409 });
    if (item.usageLog?.lockedAt) return NextResponse.json({ error: "บันทึกการใช้รถนี้ถูกปิดแล้ว ไม่สามารถแก้ไขได้" }, { status: 409 });
    if (body.actualDepartureAt && item.departureAt && new Date(body.actualDepartureAt) < new Date(item.departureAt) && !isAdmin) return NextResponse.json({ error: "เวลาออกจริงไม่ควรเร็วกว่ากำหนดออกเดินทาง" }, { status: 400 });
    const usage = await prisma.$transaction(async (tx) => {
      const saved = await tx.vehicleUsageLog.upsert({
        where: { vehicleRequestId: item.id },
        create: { vehicleRequestId: item.id, driverId: driver.id, actualDepartureAt: body.actualDepartureAt ? new Date(body.actualDepartureAt) : null, actualReturnAt: body.actualReturnAt ? new Date(body.actualReturnAt) : null, odometerStart: body.odometerStart, odometerEnd: body.odometerEnd, preTripCheck: body.preTripCheck, postTripCheck: body.postTripCheck, hasIncident: body.hasIncident, incidentDetail: body.incidentDetail || null, operationNote: body.operationNote || null, fuelEntries: { create: body.fuelEntries.map((f) => ({ fuelType: f.fuelType, liters: f.liters, pricePerLiter: f.pricePerLiter ?? null, amount: f.amount, receiptNo: f.receiptNo || null, note: f.note || null })) }, expenses: { create: body.expenses.map((e) => ({ type: e.type, amount: e.amount, detail: e.detail || null, receiptNo: e.receiptNo || null, evidencePath: e.evidencePath || null })) } },
        update: { actualDepartureAt: body.actualDepartureAt ? new Date(body.actualDepartureAt) : null, actualReturnAt: body.actualReturnAt ? new Date(body.actualReturnAt) : null, odometerStart: body.odometerStart, odometerEnd: body.odometerEnd, preTripCheck: body.preTripCheck, postTripCheck: body.postTripCheck, hasIncident: body.hasIncident, incidentDetail: body.incidentDetail || null, operationNote: body.operationNote || null, fuelEntries: { deleteMany: {}, create: body.fuelEntries.map((f) => ({ fuelType: f.fuelType, liters: f.liters, pricePerLiter: f.pricePerLiter ?? null, amount: f.amount, receiptNo: f.receiptNo || null, note: f.note || null })) }, expenses: { deleteMany: {}, create: body.expenses.map((e) => ({ type: e.type, amount: e.amount, detail: e.detail || null, receiptNo: e.receiptNo || null, evidencePath: e.evidencePath || null })) } }, include: { fuelEntries: true, expenses: true },
      });
      const finalizing = Boolean(body.actualReturnAt && body.odometerEnd !== undefined);
      if (finalizing) await tx.vehicleUsageLog.update({ where: { id: saved.id }, data: { lockedAt: new Date() } });
      await tx.vehicleRequest.update({ where: { id: item.id }, data: { status: finalizing ? "COMPLETED" : "IN_PROGRESS" } });
      return { ...saved, lockedAt: finalizing ? new Date() : saved.lockedAt };
    });
    await audit({ userId: user.id, action: usage.lockedAt ? "COMPLETE_VEHICLE_USAGE" : "START_VEHICLE_USAGE", resource: "VEHICLE_USAGE_LOG", resourceId: usage.publicId, result: "SUCCESS", metadata: { vehicleRequestId: item.publicId, odometerStart: body.odometerStart, odometerEnd: body.odometerEnd ?? null } });
    return NextResponse.json({ data: usage });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลบันทึกการใช้รถไม่ถูกต้อง", details: error.flatten() }, { status: 400 });
    const forbidden = error instanceof Error && error.message === "FORBIDDEN"; return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
