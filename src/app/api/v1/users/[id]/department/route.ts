import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { ensureSpecialRoles } from "@/lib/provider-id";

const schema = z.object({ departmentId: z.string().uuid().nullable() });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { publicId: id } });
    if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    let internalDepartmentId: string | null = null;
    if (body.departmentId) {
      const department = await prisma.department.findUnique({ where: { publicId: body.departmentId } });
      if (!department || department.deletedAt || department.status !== "ACTIVE") return NextResponse.json({ error: "DEPARTMENT_NOT_AVAILABLE" }, { status: 400 });
      internalDepartmentId = department.id;
    }
    await prisma.user.update({ where: { id: user.id }, data: { departmentId: internalDepartmentId } });
    await ensureSpecialRoles(user.id);
    await audit({ userId: actor.id, action: "UPDATE", resource: "USER_DEPARTMENT", resourceId: id, result: "SUCCESS", metadata: { departmentId: body.departmentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status });
  }
}
