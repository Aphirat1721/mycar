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
}).refine((value) => `${value.returnDate}T${value.returnTime}` > `${value.departureDate}T${value.departureTime}`, {
  message: "วันเวลาเดินทางกลับต้องมากกว่าวันเวลาออกเดินทาง",
  path: ["returnDate"],
});

function dateValue(value: string) { return new Date(`${value}T00:00:00.000Z`); }
function timeValue(value: string) { return new Date(`1970-01-01T${value}:00.000Z`); }
function todayBangkok() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export async function GET() {
  try {
    const user = await requireUser();
    const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
    const requests = await prisma.vehicleRequest.findMany({
      where: isAdmin ? {} : { requesterId: user.id },
      orderBy: [{ departureDate: "desc" }, { departureTime: "desc" }], take: 100,
      include: { requester: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { publicId: true, code: true, nameTh: true } }, vehicle: { select: { publicId: true, licensePlate: true, brand: true, model: true } }, driver: { select: { publicId: true, firstName: true, lastName: true, nickname: true } } },
    });
    return NextResponse.json({ data: requests });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const today = todayBangkok();
    if (body.departureDate < today) return NextResponse.json({ error: "ไม่สามารถขอใช้รถย้อนหลังได้" }, { status: 400 });
    const created = await prisma.vehicleRequest.create({
      data: { requesterId: user.id, departmentId: user.departmentId ?? null, departureAt: new Date(`${body.departureDate}T${body.departureTime}:00+07:00`), returnAt: new Date(`${body.returnDate}T${body.returnTime}:00+07:00`), departureDate: dateValue(body.departureDate), departureTime: timeValue(body.departureTime), returnDate: dateValue(body.returnDate), returnTime: timeValue(body.returnTime), destination: body.destination, purpose: body.purpose, passengerCount: body.passengerCount, passengerNames: body.passengerNames || null, note: body.note || null,
      }, include: { department: true },
    });
    await audit({ userId: user.id, action: "CREATE", resource: "VEHICLE_REQUEST", resourceId: created.publicId, result: "SUCCESS" });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง", details: error.flatten() }, { status: 400 });
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status });
  }
}
