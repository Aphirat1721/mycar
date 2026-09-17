import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyMeetingPublicToken } from "@/lib/meeting-public-link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "รายละเอียดการจองห้องประชุม",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function PublicMeetingBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifyMeetingPublicToken(token);
  if (!verified) notFound();

  const booking = await prisma.meetingBooking.findUnique({
    where: { publicId: verified.publicId },
    select: {
      publicId: true,
      title: true,
      purpose: true,
      attendeeCount: true,
      attendeeNames: true,
      startAt: true,
      endAt: true,
      status: true,
      rejectionReason: true,
      cancelledAt: true,
      room: { select: { nameTh: true, location: true, capacity: true } },
      requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } },
      department: { select: { nameTh: true } },
      equipment: { select: { quantity: true, equipment: { select: { nameTh: true } } } },
    },
  });

  if (!booking) notFound();

  const requesterName = booking.requester.nameTh?.trim() || [booking.requester.firstnameTh, booking.requester.lastnameTh].filter(Boolean).join(" ").trim() || "ไม่ระบุ";
  const formatDate = (value: Date) => value.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const formatTime = (value: Date) => value.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const statusLabel: Record<string, string> = { PENDING: "รออนุมัติ", APPROVED: "อนุมัติแล้ว", REJECTED: "ไม่อนุมัติ", CANCELLED: "ยกเลิกแล้ว", COMPLETED: "เสร็จสิ้น" };
  const status = statusLabel[booking.status] ?? booking.status;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <p className="text-sm text-slate-300">โรงพยาบาลเกษตรวิสัย</p>
          <h1 className="mt-1 text-xl font-semibold">รายละเอียดการจองห้องประชุม</h1>
        </header>
        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">สถานะการจอง</p>
            <p className="mt-1 text-lg font-semibold">{status}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="ผู้จอง" value={requesterName} />
            <Info label="กลุ่มงาน" value={booking.department?.nameTh || "ไม่ระบุ"} />
            <Info label="ห้องประชุม" value={booking.room.nameTh} />
            <Info label="สถานที่" value={booking.room.location || "ไม่ระบุ"} />
            <Info label="เรื่อง" value={booking.title} wide />
            <Info label="วันที่" value={formatDate(booking.startAt)} />
            <Info label="เวลา" value={`${formatTime(booking.startAt)} - ${formatTime(booking.endAt)} น.`} />
            <Info label="จำนวนผู้เข้าร่วม" value={`${booking.attendeeCount} คน`} />
            {booking.purpose ? <Info label="วัตถุประสงค์" value={booking.purpose} wide /> : null}
            {booking.attendeeNames ? <Info label="รายชื่อผู้เข้าร่วม" value={booking.attendeeNames} wide /> : null}
            {booking.rejectionReason ? <Info label="เหตุผลที่ไม่อนุมัติ" value={booking.rejectionReason} wide /> : null}
          </div>
          {booking.equipment.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-slate-500">อุปกรณ์ที่ขอใช้</p>
              <ul className="mt-2 space-y-2 text-sm">
                {booking.equipment.map((item) => <li key={item.equipment.nameTh} className="rounded-lg bg-slate-50 px-3 py-2">{item.equipment.nameTh} {item.quantity > 1 ? `(${item.quantity})` : ""}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">ลิงก์นี้ใช้สำหรับดูรายละเอียดการจองรายการนี้เท่านั้น</p>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{value}</p></div>;
}
