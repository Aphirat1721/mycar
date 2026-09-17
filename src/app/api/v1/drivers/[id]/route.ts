import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  nickname: z.string().trim().max(100).nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

async function resolveUserId(userId: string | null | undefined, currentDriverId: string) {
  if (userId === undefined) return undefined;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { publicId: userId }, select: { id: true, status: true, driver: { select: { id: true } } } });
  if (!user || user.status !== "ACTIVE") throw new Error("USER_NOT_AVAILABLE");
  if (user.driver && user.driver.id !== currentDriverId) throw new Error("USER_ALREADY_DRIVER");
  return user.id;
}

async function ensureDriverRole(userId: string) {
  const application = await prisma.application.upsert({ where: { code: "MYCAR" }, create: { code: "MYCAR", nameTh: "ระบบขอใช้รถยนต์", basePath: "/dashboard", iconKey: "car", sortOrder: 10 }, update: {} });
  const role = await prisma.role.upsert({ where: { applicationId_key: { applicationId: application.id, key: "DRIVER" } }, create: { applicationId: application.id, key: "DRIVER", nameTh: "พนักงานขับรถ" }, update: { nameTh: "พนักงานขับรถ" } });
  await prisma.userApplication.upsert({ where: { userId_applicationId: { userId, applicationId: application.id } }, create: { userId, applicationId: application.id }, update: {} });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId, roleId: role.id } }, create: { userId, roleId: role.id }, update: {} });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const existing = await prisma.driver.findUnique({ where: { publicId: id } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const internalUserId = await resolveUserId(body.userId, existing.id);
    const driver = await prisma.driver.update({ where: { id: existing.id }, data: { ...body, userId: internalUserId }, include: { user: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } } } });
    if (internalUserId) await ensureDriverRole(internalUserId);
    await audit({ userId: actor.id, action: "UPDATE", resource: "DRIVER", resourceId: id, result: "SUCCESS", metadata: { linkedUserId: body.userId === undefined ? undefined : body.userId } });
    return NextResponse.json({ data: driver });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const message = error instanceof Error ? error.message : "";
    if (["USER_NOT_AVAILABLE", "USER_ALREADY_DRIVER"].includes(message)) return NextResponse.json({ error: message === "USER_ALREADY_DRIVER" ? "ผู้ใช้นี้ถูกผูกเป็นพนักงานขับรถอยู่แล้ว" : "ผู้ใช้ไม่พร้อมสำหรับการผูกเป็นพนักงานขับรถ" }, { status: 409 });
    const forbidden = message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const existing = await prisma.driver.findUnique({ where: { publicId: id } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await prisma.driver.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    await audit({ userId: actor.id, action: "DELETE", resource: "DRIVER", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
