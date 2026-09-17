import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  destination: z.string().trim().min(1).max(500),
  purpose: z.string().trim().min(1).max(1000),
  passengerCount: z.coerce.number().int().min(1).max(100),
  passengerNames: z.string().trim().max(5000).optional().or(z.literal("")),
  note: z.string().trim().max(5000).optional().or(z.literal("")),
}).refine((v) => `${v.returnDate}T${v.returnTime}` > `${v.departureDate}T${v.departureTime}`, {
  message: "วันเวลาเดินทางกลับต้องมากกว่าวันเวลาออกเดินทาง",
  path: ["returnDate"],
});

function dateValue(value: string) { return new Date(`${value}T00:00:00.000Z`); }
function timeValue(value: string) { return new Date(`1970-01-01T${value}:00.000Z`); }
function todayBangkok() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

async function canManageApproved(userId: string) {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { key: true, rolePermissions: { select: { permission: { select: { key: true } } } } } } },
  });
  return rows.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key) || role.rolePermissions.some(({ permission }) => permission.key === "MANAGE_VEHICLE_REQUESTS"));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const current = await prisma.vehicleRequest.findUnique({ where: { publicId: id }, select: { id: true, publicId: true, requesterId: true, status: true } });
    if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const privileged = await canManageApproved(user.id);
    const owner = current.requesterId === user.id;
    if (!owner && !privileged) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    if (body.action === "CANCEL") {
      if (!["PENDING", "APPROVED"].includes(current.status)) return NextResponse.json({ error: "คำขอนี้ไม่สามารถยกเลิกได้" }, { status: 409 });
      if (current.status === "APPROVED" && !privileged) return NextResponse.json({ error: "เฉพาะผู้ดูแลหรือผู้ที่ได้รับสิทธิ์เท่านั้นที่ยกเลิกคำขอที่อนุมัติแล้วได้" }, { status: 403 });
      await prisma.vehicleRequest.update({ where: { id: current.id }, data: { status: "CANCELLED" } });
      await audit({ userId: user.id, action: "CANCEL", resource: "VEHICLE_REQUEST", resourceId: id, result: "SUCCESS" });
      return NextResponse.json({ ok: true, status: "CANCELLED" });
    }

    if (!["PENDING", "APPROVED"].includes(current.status)) return NextResponse.json({ error: "คำขอนี้ไม่สามารถแก้ไขได้" }, { status: 409 });
    if (current.status === "APPROVED" && !privileged) return NextResponse.json({ error: "เฉพาะผู้ดูแลหรือผู้ที่ได้รับสิทธิ์เท่านั้นที่แก้ไขคำขอที่อนุมัติแล้วได้" }, { status: 403 });

    const data = schema.parse(body);
    if (data.departureDate < todayBangkok()) return NextResponse.json({ error: "ไม่สามารถขอใช้รถย้อนหลังได้" }, { status: 400 });
    const updated = await prisma.vehicleRequest.update({
      where: { id: current.id },
      data: {
        departureAt: new Date(`${data.departureDate}T${data.departureTime}:00+07:00`),
        returnAt: new Date(`${data.returnDate}T${data.returnTime}:00+07:00`),
        departureDate: dateValue(data.departureDate), departureTime: timeValue(data.departureTime),
        returnDate: dateValue(data.returnDate), returnTime: timeValue(data.returnTime),
        destination: data.destination, purpose: data.purpose, passengerCount: data.passengerCount,
        passengerNames: data.passengerNames || null, note: data.note || null,
      },
    });
    await audit({ userId: user.id, action: "UPDATE", resource: "VEHICLE_REQUEST", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง", details: error.flatten() }, { status: 400 });
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status });
  }
}
