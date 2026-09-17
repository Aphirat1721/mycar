import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  nickname: z.string().trim().max(100).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

async function resolveUserId(userId: string | null | undefined) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { publicId: userId }, select: { id: true, status: true, driver: { select: { id: true } } } });
  if (!user || user.status !== "ACTIVE") throw new Error("USER_NOT_AVAILABLE");
  if (user.driver) throw new Error("USER_ALREADY_DRIVER");
  return user.id;
}

async function ensureDriverRole(userId: string) {
  const application = await prisma.application.upsert({ where: { code: "MYCAR" }, create: { code: "MYCAR", nameTh: "ระบบขอใช้รถยนต์", description: "ระบบบริหารจัดการการขอใช้รถยนต์ โรงพยาบาลเกษตรวิสัย", iconKey: "car", basePath: "/dashboard", sortOrder: 10 }, update: {} });
  const role = await prisma.role.upsert({ where: { applicationId_key: { applicationId: application.id, key: "DRIVER" } }, create: { applicationId: application.id, key: "DRIVER", nameTh: "พนักงานขับรถ" }, update: { nameTh: "พนักงานขับรถ" } });
  await prisma.userApplication.upsert({ where: { userId_applicationId: { userId, applicationId: application.id } }, create: { userId, applicationId: application.id }, update: {} });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId, roleId: role.id } }, create: { userId, roleId: role.id }, update: {} });
}

export async function GET() {
  try {
    await requireAdmin();
    const drivers = await prisma.driver.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], include: { user: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } } } });
    return NextResponse.json({ data: drivers });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = schema.parse(await request.json());
    const internalUserId = await resolveUserId(body.userId);
    const driver = await prisma.driver.create({ data: { firstName: body.firstName, lastName: body.lastName, nickname: body.nickname, status: body.status, userId: internalUserId }, include: { user: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } } } });
    if (internalUserId) await ensureDriverRole(internalUserId);
    await audit({ userId: actor.id, action: "CREATE", resource: "DRIVER", resourceId: driver.publicId, result: "SUCCESS", metadata: { linkedUserId: body.userId ?? null } });
    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() }, { status: 400 });
    const message = error instanceof Error ? error.message : "";
    if (["USER_NOT_AVAILABLE", "USER_ALREADY_DRIVER"].includes(message)) return NextResponse.json({ error: message === "USER_ALREADY_DRIVER" ? "ผู้ใช้นี้ถูกผูกเป็นพนักงานขับรถอยู่แล้ว" : "ผู้ใช้ไม่พร้อมสำหรับการผูกเป็นพนักงานขับรถ" }, { status: 409 });
    const forbidden = message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
