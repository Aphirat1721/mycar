import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const driver = await prisma.driver.findUnique({ where: { userId: user.id }, select: { id: true, status: true, deletedAt: true } });
    if (!driver || driver.status !== "ACTIVE" || driver.deletedAt) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const data = await prisma.vehicleRequest.findMany({
      where: { driverId: driver.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
      include: { requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { code: true, nameTh: true } }, vehicle: { select: { licensePlate: true, brand: true, model: true, color: true } }, usageLog: { include: { fuelEntries: true, expenses: true } } },
    });
    return NextResponse.json({ data });
  } catch (error) { const forbidden = error instanceof Error && error.message === "FORBIDDEN"; return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 }); }
}
