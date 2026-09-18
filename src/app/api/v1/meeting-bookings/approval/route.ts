import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/session";
import { hasApplicationRole, hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { buildMeetingNotificationMessage, createMeetingBookingNotification, sendMophNotifyMeetingEvent } from "@/lib/notifications";
import { createMeetingPublicUrl, getPublicOrigin } from "@/lib/meeting-public-link";

async function requireMeetingManager() { const user = await getCurrentUser(); if (!user) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const; const isAdmin = await hasApplicationRole(user.id,"MEETING_ROOMS"); if (!isAdmin && !(await hasPermission(user.id, "APPROVE_MEETING_BOOKINGS", "MEETING_ROOMS"))) return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const; return { user } as const; }
function getRequesterName(user: { nameTh: string | null; firstnameTh: string | null; lastnameTh: string | null }) { return user.nameTh?.trim() || [user.firstnameTh, user.lastnameTh].filter(Boolean).join(" ").trim() || null; }

export async function GET() { const auth = await requireMeetingManager(); if ("error" in auth) return auth.error; const bookings = await prisma.meetingBooking.findMany({ where: { status: { in: ["PENDING","APPROVED","REJECTED","CANCELLED"] } }, orderBy: { startAt: "asc" }, include: { room: { select: { publicId: true, nameTh: true, location: true, capacity: true } }, requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true, department: { select: { nameTh: true } } } } } }); return NextResponse.json({ bookings }); }

export async function PATCH(request: Request) {
  const auth = await requireMeetingManager(); if ("error" in auth) return auth.error;
  const body = await request.json(); const action = String(body.action || ""); const reason = body.reason ? String(body.reason).trim() : "";
  if (!["APPROVE", "REJECT", "CANCEL"].includes(action)) return NextResponse.json({ error: "ข้อมูลการดำเนินการไม่ถูกต้อง" }, { status: 400 });
  const id = String(body.id || "");
  const current = await prisma.meetingBooking.findUnique({ where: { publicId: id }, select: { id: true, publicId: true, title: true, startAt: true, endAt: true, status: true, requesterId: true, approvedById: true, preparedById: true, preparedAt: true, preparationStatus: true, room: { select: { nameTh: true } }, requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true, department: { select: { nameTh: true } } } } } });
  if (!current) return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  if (action === "APPROVE" && current.status !== "PENDING") return NextResponse.json({ error: "อนุมัติได้เฉพาะรายการที่รออนุมัติ" }, { status: 409 });
  if (action === "REJECT" && current.status !== "PENDING") return NextResponse.json({ error: "ไม่อนุมัติได้เฉพาะรายการที่รออนุมัติ" }, { status: 409 });
  if (action === "CANCEL" && !["PENDING","APPROVED"].includes(current.status)) return NextResponse.json({ error: "ยกเลิกได้เฉพาะรายการที่รออนุมัติหรืออนุมัติแล้ว" }, { status: 409 });
  if (action === "REJECT" && !reason) return NextResponse.json({ error: "กรุณาระบุเหตุผลที่ไม่อนุมัติ" }, { status: 400 });
  if (action === "CANCEL" && !reason) return NextResponse.json({ error: "กรุณาระบุเหตุผลการยกเลิก" }, { status: 400 });

  const data = action === "APPROVE" ? { status: "APPROVED" as const, approvedById: auth.user.id, approvedAt: new Date(), preparedById: auth.user.id, preparedAt: null, preparationStatus: "NOT_STARTED" as const, rejectionReason: null, updatedAt: new Date() } : action === "REJECT" ? { status: "REJECTED" as const, approvedById: null, approvedAt: null, rejectionReason: reason || null, updatedAt: new Date() } : { status: "CANCELLED" as const, cancellationReason: reason || null, cancelledAt: new Date(), updatedAt: new Date() };
  const updated = await prisma.meetingBooking.update({ where: { id: current.id }, data, select: { publicId: true, status: true } });

  if (action === "APPROVE" || action === "REJECT") {
    const requesterName = getRequesterName(current.requester); const departmentName = current.requester.department?.nameTh ?? null; const detailUrl = createMeetingPublicUrl(current.publicId, getPublicOrigin(request));
    const notificationInput = { requesterId: current.requesterId, bookingId: current.id, publicId: current.publicId, roomName: current.room.nameTh, title: current.title, startAt: current.startAt, endAt: current.endAt, status: updated.status, eventType: "MEETING_BOOKING_UPDATED" as const, requesterName, departmentName, detailUrl };
    const message = action === "APPROVE" ? `${buildMeetingNotificationMessage(notificationInput)}\n\n✅ การจองได้รับการอนุมัติแล้ว` : `${buildMeetingNotificationMessage(notificationInput)}\n\n❌ การจองไม่ได้รับการอนุมัติ\n📝 เหตุผล: ${reason}`;
    try { await createMeetingBookingNotification(notificationInput); } catch (error) { console.error(`IN_APP meeting ${action.toLowerCase()} notification failed`, error); }
    try { const notifyResult = await sendMophNotifyMeetingEvent({ requesterId: current.requesterId, publicId: current.publicId, eventType: "MEETING_BOOKING_UPDATED", message, detailUrl }); console.info(`MOPH Notify meeting ${action.toLowerCase()} result`, notifyResult); } catch (error) { console.error(`MOPH Notify meeting ${action.toLowerCase()} failed`, error); }
  }

  if (action === "CANCEL") {
    const requesterName = getRequesterName(current.requester); const departmentName = current.requester.department?.nameTh ?? null; const detailUrl = createMeetingPublicUrl(current.publicId, getPublicOrigin(request));
    const notificationInput = { requesterId: current.requesterId, bookingId: current.id, publicId: current.publicId, roomName: current.room.nameTh, title: current.title, startAt: current.startAt, endAt: current.endAt, status: updated.status, eventType: "MEETING_BOOKING_CANCELLED" as const, requesterName, departmentName, detailUrl };
    const message = `${buildMeetingNotificationMessage(notificationInput)}\n📝 เหตุผลการยกเลิก: ${reason}`;
    try { await createMeetingBookingNotification(notificationInput); } catch (error) { console.error("IN_APP meeting approval cancellation notification failed", error); }
    try { const notifyResult = await sendMophNotifyMeetingEvent({ requesterId: current.requesterId, publicId: current.publicId, eventType: "MEETING_BOOKING_CANCELLED", message, detailUrl }); console.info("MOPH Notify approval cancellation result", notifyResult); } catch (error) { console.error("MOPH Notify approval cancellation failed", error); }
  }

  await prisma.auditLog.create({ data: { userId: auth.user.id, action: `${action}_MEETING_BOOKING`, resource: "MEETING_BOOKING", resourceId: current.publicId, result: "SUCCESS", metadata: { reason: reason || null, cancellationReason: action === "CANCEL" ? (reason || null) : null } } });
  return NextResponse.json({ booking: updated });
}
