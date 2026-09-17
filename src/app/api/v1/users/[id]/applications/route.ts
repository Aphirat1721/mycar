import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({ applicationIds: z.array(z.string().uuid()).max(50) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const { applicationIds } = schema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { publicId: id } });
    if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (user.id === actor.id && !actor.roles.some(({ role }) => role.key === "SUPER_ADMIN")) {
      return NextResponse.json({ error: "SELF_ACCESS_CHANGE_NOT_ALLOWED" }, { status: 403 });
    }

    const activeApplications = await prisma.application.findMany({
      where: { id: { in: applicationIds }, status: "ACTIVE" },
      select: { id: true, code: true },
    });
    if (activeApplications.length !== applicationIds.length) {
      return NextResponse.json({ error: "APPLICATION_NOT_AVAILABLE" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userApplication.deleteMany({ where: { userId: user.id } });
      if (activeApplications.length > 0) {
        await tx.userApplication.createMany({
          data: activeApplications.map((application) => ({ userId: user.id, applicationId: application.id })),
        });
      }
    });

    await audit({
      userId: actor.id,
      action: "UPDATE_APPLICATION_ACCESS",
      resource: "USER",
      resourceId: id,
      result: "SUCCESS",
      metadata: { applicationCodes: activeApplications.map((item) => item.code) },
    });

    return NextResponse.json({ ok: true, applications: activeApplications.map((item) => item.id) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
