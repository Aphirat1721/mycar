import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({ role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "VEHICLE_APPROVER", "DRIVER_EVALUATION_REVIEWER", "MEETING_APPROVER"]), application: z.enum(["MYCAR", "MEETING_ROOMS"]).default("MYCAR") });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const { role, application } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { publicId: id } });
    if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const roleRecord = await prisma.role.findFirst({ where: { key: role, application: { code: application } } });
    if (!roleRecord) return NextResponse.json({ error: "ROLE_NOT_CONFIGURED" }, { status: 500 });

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: user.id, role: { application: { code: application } } } });
      await tx.userRole.create({ data: { userId: user.id, roleId: roleRecord.id } });
    });

    await audit({ userId: actor.id, action: "UPDATE_ROLE", resource: "USER", resourceId: id, result: "SUCCESS", metadata: { application, role } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
