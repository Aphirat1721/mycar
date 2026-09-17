import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";

const schema = z.object({
  licensePlate: z.string().trim().max(30).optional().nullable(),
  brand: z.string().trim().max(80).optional().nullable(),
  model: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  vehicleType: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export async function GET() {
  try {
    await requireAdmin();
    const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ data: vehicles });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = schema.parse(await request.json());
    const vehicle = await prisma.vehicle.create({ data: body });
    await audit({ userId: user.id, action: "CREATE", resource: "VEHICLE", resourceId: vehicle.publicId, result: "SUCCESS" });
    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status });
  }
}
