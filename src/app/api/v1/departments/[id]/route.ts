import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({ code: z.string().trim().min(1).max(30).optional(), nameTh: z.string().trim().min(1).max(200).optional(), abbreviation: z.string().trim().max(30).optional().nullable(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireAdmin(); const { id } = await params; const existing = await prisma.department.findUnique({ where: { publicId: id } }); if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); const body = schema.parse(await request.json()); const department = await prisma.department.update({ where: { id: existing.id }, data: body }); await audit({ userId: user.id, action: "UPDATE", resource: "DEPARTMENT", resourceId: id, result: "SUCCESS" }); return NextResponse.json({ data: department }); }
  catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }); if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "รหัสแผนกนี้มีอยู่แล้ว" }, { status: 409 }); const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401; return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireAdmin(); const { id } = await params; const existing = await prisma.department.findUnique({ where: { publicId: id } }); if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); await prisma.department.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: "INACTIVE" } }); await audit({ userId: user.id, action: "DELETE", resource: "DEPARTMENT", resourceId: id, result: "SUCCESS" }); return NextResponse.json({ ok: true }); }
  catch (error) { const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401; return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status }); }
}
