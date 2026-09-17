import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({ code: z.string().trim().min(1).max(30), nameTh: z.string().trim().min(1).max(200), abbreviation: z.string().trim().max(30).optional().nullable(), status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE") });

export async function GET() {
  try { await requireAdmin(); const departments = await prisma.department.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { nameTh: "asc" }], include: { _count: { select: { users: true } } } }); return NextResponse.json({ data: departments }); }
  catch (error) { const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401; return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status }); }
}

export async function POST(request: Request) {
  try { const user = await requireAdmin(); const body = schema.parse(await request.json()); const department = await prisma.department.create({ data: body }); await audit({ userId: user.id, action: "CREATE", resource: "DEPARTMENT", resourceId: department.publicId, result: "SUCCESS" }); return NextResponse.json({ data: department }, { status: 201 }); }
  catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() }, { status: 400 }); if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "รหัสแผนกนี้มีอยู่แล้ว" }, { status: 409 }); const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401; return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status }); }
}
