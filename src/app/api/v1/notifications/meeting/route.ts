import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/session";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function displayName(user: { nameTh?: string | null; firstnameTh?: string | null; lastnameTh?: string | null }) {
  return user.nameTh?.trim() || [user.firstnameTh, user.lastnameTh].filter(Boolean).join(" ").trim() || "ผู้ใช้งาน";
}

function bookingTitle(booking: { room: { nameTh: string }; title: string; startAt: Date; endAt: Date }) {
  const date = booking.startAt.toLocaleDateString("th-TH");
  const start = booking.startAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const end = booking.endAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${booking.room.nameTh} · ${booking.title} · ${date} ${start}-${end}`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const canManageMeeting =
      user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key)) ||
      await hasPermission(user.id, "APPROVE_MEETING_BOOKINGS");

    const now = new Date();
    const items: Array<{
      id: string;
      kind: "EVALUATION" | "PENDING" | "DUE" | "OVERDUE";
      title: string;
      message: string;
      href: string;
      priority: "normal" | "high" | "urgent";
      startAt: string;
    }> = [];

    if (canManageMeeting) {
      const bookings = await prisma.meetingBooking.findMany({
        where: {
          OR: [
            { status: "PENDING" },
            { status: "APPROVED", startAt: { lte: now }, preparationStatus: { not: "READY" } },
            { status: "APPROVED", endAt: { lt: now } },
          ],
        },
        orderBy: { startAt: "asc" },
        select: {
          publicId: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          preparationStatus: true,
          room: { select: { nameTh: true } },
          requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } },
        },
      });

      for (const booking of bookings) {
        const label = bookingTitle(booking);
        const overdue = booking.endAt < now;
        const due = booking.startAt <= now;

        if (overdue) {
          items.push({
            id: `meeting-overdue-${booking.publicId}`,
            kind: "OVERDUE",
            title: "⚠️ รายการจองเลยเวลาประชุมแล้ว",
            message: booking.status === "PENDING"
              ? `${label} ยังอยู่ในสถานะรออนุมัติ`
              : `${label} ยังไม่ได้ปรับสถานะเป็นเสร็จสิ้น`,
            href: booking.status === "PENDING" ? "/portal/meeting-rooms/approval" : "/portal/meeting-rooms/status",
            priority: "urgent",
            startAt: booking.startAt.toISOString(),
          });
        } else if (due) {
          items.push({
            id: `meeting-due-${booking.publicId}`,
            kind: "DUE",
            title: "🔔 ถึงเวลาประชุมแล้ว",
            message: booking.status === "PENDING"
              ? `${label} ยังไม่ได้ดำเนินการอนุมัติ`
              : `${label} ยังไม่ได้ดำเนินการเตรียมห้องให้พร้อม`,
            href: booking.status === "PENDING" ? "/portal/meeting-rooms/approval" : "/portal/meeting-rooms/status",
            priority: "high",
            startAt: booking.startAt.toISOString(),
          });
        } else {
          items.push({
            id: `meeting-pending-${booking.publicId}`,
            kind: "PENDING",
            title: "📋 มีรายการจองรออนุมัติ",
            message: `${label} · ผู้จอง ${displayName(booking.requester)}`,
            href: "/portal/meeting-rooms/approval",
            priority: "normal",
            startAt: booking.startAt.toISOString(),
          });
        }
      }
    }

    const evaluations = await prisma.meetingBooking.findMany({
      where: { requesterId: user.id, status: "COMPLETED", evaluation: null },
      orderBy: { endAt: "desc" },
      select: { publicId: true, title: true, startAt: true, endAt: true, room: { select: { nameTh: true } } },
    });

    for (const booking of evaluations) {
      items.push({
        id: `meeting-evaluation-${booking.publicId}`,
        kind: "EVALUATION",
        title: "⭐ ยังไม่ได้ประเมินห้องประชุม",
        message: bookingTitle(booking),
        href: `/portal/meeting-rooms/evaluate/${booking.publicId}`,
        priority: "normal",
        startAt: booking.startAt.toISOString(),
      });
    }

    items.sort((a, b) => {
      const rank = { urgent: 0, high: 1, normal: 2 } as const;
      return rank[a.priority] - rank[b.priority] || new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    });

    return NextResponse.json(
      { count: items.length, items: items.slice(0, 20), generatedAt: now.toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("MEETING_NOTIFICATION_FETCH_FAILED", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดการแจ้งเตือนได้" }, { status: 500 });
  }
}
