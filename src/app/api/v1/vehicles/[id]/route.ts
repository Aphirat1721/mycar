import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({
  licensePlate: z.string().trim().max(30).nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
  vehicleType: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const existing = await prisma.vehicle.findUnique({ where: { publicId: id } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const vehicle = await prisma.vehicle.update({ where: { id: existing.id }, data: body });
    await audit({ userId: user.id, action: "UPDATE", resource: "VEHICLE", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ data: vehicle });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: 403 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const existing = await prisma.vehicle.findUnique({ where: { publicId: id } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await prisma.vehicle.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    await audit({ userId: user.id, action: "DELETE", resource: "VEHICLE", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: 403 });
  }
}
