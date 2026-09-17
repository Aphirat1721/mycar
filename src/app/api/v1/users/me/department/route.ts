import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const schema = z.object({ departmentId: z.string().uuid() });

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    if (user.departmentId) return NextResponse.json({ error: "DEPARTMENT_ALREADY_SET" }, { status: 409 });
    const body = schema.parse(await request.json());
    const department = await prisma.department.findUnique({ where: { publicId: body.departmentId } });
    if (!department || department.deletedAt || department.status !== "ACTIVE") {
      return NextResponse.json({ error: "DEPARTMENT_NOT_AVAILABLE" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { departmentId: department.id },
      include: { department: { select: { publicId: true, code: true, nameTh: true } } },
    });
    await audit({
      userId: user.id,
      action: "UPDATE",
      resource: "MY_DEPARTMENT",
      resourceId: user.publicId,
      result: "SUCCESS",
      metadata: { departmentId: department.publicId, departmentName: department.nameTh },
    });
    return NextResponse.json({ data: updated.department });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "UNAUTHENTICATED" : "INTERNAL_SERVER_ERROR" }, { status });
  }
}
