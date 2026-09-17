function bangkokDateIso() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/modules/identity/session";
import { prisma } from "@/lib/prisma";
import { hasApplicationAccess } from "@/modules/portal/applications";
import { buildMeetingNotificationMessage, createMeetingBookingNotification, sendMophNotifyMeetingEvent } from "@/lib/notifications";
import { createMeetingPublicUrl, getPublicOrigin } from "@/lib/meeting-public-link";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!(await hasApplicationAccess(user.id, "MEETING_ROOMS"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await request.json();
  const roomId = String(body.roomId || "").trim();
  const title = String(body.title || "").trim();
  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);
  const attendeeRaw = String(body.attendeeCount ?? "").trim();
  const attendeeCount = Number(attendeeRaw);

  const todayIso = bangkokDateIso();
  const startDatePart = String(body.startAt || "").slice(0, 10);
  const endDatePart = String(body.endAt || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDatePart) || startDatePart < todayIso || !/^\d{4}-\d{2}-\d{2}$/.test(endDatePart) || endDatePart < todayIso) return NextResponse.json({ error: "ไม่สามารถจองวันที่ผ่านมาแล้วได้ กรุณาเลือกวันที่ตั้งแต่วันนี้เป็นต้นไป" }, { status: 400 });

  if (!roomId || !title || !/^\d+$/.test(attendeeRaw) || attendeeCount < 1 || !Number.isInteger(attendeeCount) || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) return NextResponse.json({ error: "ข้อมูลการจองไม่ถูกต้อง" }, { status: 400 });

  const room = await prisma.meetingRoom.findFirst({ where: { publicId: roomId, status: "ACTIVE", deletedAt: null }, select: { id: true, publicId: true, nameTh: true, capacity: true } });
  if (!room) return NextResponse.json({ error: "ไม่พบห้องประชุม" }, { status: 404 });
  if (attendeeCount > room.capacity) return NextResponse.json({ error: `จำนวนผู้เข้าร่วมเกินความจุห้อง (${room.capacity} คน)` }, { status: 400 });

  const overlap = await prisma.meetingBooking.findFirst({
    where: { roomId: room.id, status: { in: ["PENDING", "APPROVED"] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
    select: { publicId: true },
  });
  if (overlap) return NextResponse.json({ error: "ช่วงเวลานี้มีการจองห้องแล้ว" }, { status: 409 });

  const equipmentIds = Array.isArray(body.equipmentIds) ? body.equipmentIds.map(String) : [];
  const equipment = equipmentIds.length ? await prisma.meetingEquipment.findMany({ where: { publicId: { in: equipmentIds }, status: "ACTIVE" }, select: { id: true } }) : [];

  const booking = await prisma.meetingBooking.create({
    data: {
      id: randomUUID(),
      publicId: randomUUID(),
      roomId: room.id,
      requesterId: user.id,
      departmentId: user.departmentId ?? null,
      title,
      purpose: body.purpose ? String(body.purpose) : null,
      attendeeCount,
      startAt,
      endAt,
      status: "PENDING",
      updatedAt: new Date(),
      equipment: { create: equipment.map((item) => ({ equipmentId: item.id, quantity: 1 })) },
    },
  });

  const requester = await prisma.user.findUnique({ where: { id: user.id }, select: { nameTh: true, firstnameTh: true, lastnameTh: true, department: { select: { nameTh: true } } } });
  const requesterName = requester?.nameTh?.trim() || [requester?.firstnameTh, requester?.lastnameTh].filter(Boolean).join(" ").trim() || null;
  const departmentName = requester?.department?.nameTh ?? null;
  const detailUrl = createMeetingPublicUrl(booking.publicId, getPublicOrigin(request));
  const notificationInput = { requesterId: user.id, bookingId: booking.id, publicId: booking.publicId, roomName: room.nameTh, title, startAt, endAt, status: booking.status, eventType: "MEETING_BOOKING_CREATED" as const, requesterName, departmentName, detailUrl };
  const message = buildMeetingNotificationMessage(notificationInput);

  try { await createMeetingBookingNotification(notificationInput); } catch (error) { console.error("IN_APP meeting create notification failed", error); }
  try { await sendMophNotifyMeetingEvent({ requesterId: user.id, publicId: booking.publicId, eventType: "MEETING_BOOKING_CREATED", message, detailUrl }); } catch (error) { console.error("MOPH Notify create booking failed", error); }

  return NextResponse.json({ publicId: booking.publicId, status: booking.status }, { status: 201 });
}
