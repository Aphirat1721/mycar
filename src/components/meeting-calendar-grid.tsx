import Link from "next/link";
import {CheckCircle2,Clock3} from "lucide-react";

type Booking = {
  publicId: string;
  title: string;
  purpose: string | null;
  status: string;
  preparationStatus?: string;
  startAt: Date;
  endAt: Date;
  room: { publicId?: string; nameTh: string };
  requester: {
    id: string;
    nameTh: string | null;
    firstnameTh: string | null;
    lastnameTh: string | null;
    department: { nameTh: string } | null;
  };
};

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const ROOM_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-violet-50 border-violet-200 text-violet-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
];

export default function MeetingCalendarGrid({ bookings, month }: { bookings: Booking[]; month: Date; currentUserId?: string }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);

  const roomColors = new Map<string, string>();
  for (const booking of bookings) {
    const roomKey = booking.room.publicId ?? booking.room.nameTh;
    if (!roomColors.has(roomKey)) {
      roomColors.set(roomKey, ROOM_COLORS[roomColors.size % ROOM_COLORS.length]);
    }
  }

  const requesterName = (booking: Booking) =>
    booking.requester.nameTh ||
    [booking.requester.firstnameTh, booking.requester.lastnameTh].filter(Boolean).join(" ") ||
    "ไม่ระบุชื่อ";

  return (
    <div className="meeting-calendar-grid overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">
        <div>
          <h2 className="font-black text-slate-900">ปฏิทินการจอง</h2>
          <p className="mt-1 text-xs text-slate-500">
            {new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(month)}
          </p>
        </div>
        <Link href="/portal/meeting-rooms/calendar" className="text-sm font-bold text-teal-700">
          ดูปฏิทินเต็ม →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
        {Array.from(roomColors.entries()).map(([roomKey, className]) => (
          <span key={`room-legend-${roomKey}`} className={`rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
            {bookings.find((booking) => (booking.room.publicId ?? booking.room.nameTh) === roomKey)?.room.nameTh}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-bold text-slate-500">
        {WEEKDAYS.map((day, index) => (
          <div key={`weekday-${index}`} className="p-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-visible">
        {Array.from({ length: firstDay }, (_, index) => (
          <div key={`empty-day-${index}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/40" />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(year, monthIndex, day);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const today = new Date();
          const isToday = today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;
          const dayBookings = bookings.filter((booking) => {
            const start = booking.startAt;
            return start.getFullYear() === year && start.getMonth() === monthIndex && start.getDate() === day;
          });

          return (
            <div
              key={`calendar-day-${year}-${monthIndex}-${day}`}
              className={`relative min-h-28 border-b border-r border-slate-100 p-2 ${isToday ? "meeting-calendar-today" : isWeekend ? "bg-rose-50/70" : "bg-white"}`}
            >
              <div className="mb-2 text-sm font-black text-slate-700">{isToday ? <span className="meeting-calendar-today-number">{day}</span> : day}</div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((booking) => {
                  const roomKey = booking.room.publicId ?? booking.room.nameTh;
                  const className = roomColors.get(roomKey) ?? ROOM_COLORS[0];
                  const href = `/portal/meeting-rooms/booking/${booking.publicId}`;

                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-1 meeting-calendar-booking font-bold leading-tight"><span className="truncate">{booking.room.nameTh}</span>{booking.status === "APPROVED" ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600"/> : <Clock3 size={14} className="shrink-0 text-amber-600"/>}</div>
                      <div className="meeting-calendar-booking-time leading-tight">{formatTime(booking.startAt)}–{formatTime(booking.endAt)}</div>
                      <div className="meeting-calendar-tooltip pointer-events-none invisible absolute left-0 top-full z-[100] mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-700 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                        <div className="meeting-calendar-tooltip-title mb-2 border-b border-slate-100 pb-2 font-black text-slate-900">รายละเอียดการจอง</div>
                        <div className="space-y-1.5">
                          <div><span className="font-bold">ห้อง:</span> {booking.room.nameTh}</div>
                          <div><span className="font-bold">หัวข้อ:</span> {booking.title}</div>
                          <div><span className="font-bold">เวลา:</span> {formatTime(booking.startAt)}–{formatTime(booking.endAt)}</div>
                          <div><span className="font-bold">ผู้จอง:</span> {requesterName(booking)}</div>
                          <div><span className="font-bold">กลุ่มงาน:</span> {booking.requester.department?.nameTh || "ไม่ระบุ"}</div>
                          {booking.purpose ? <div><span className="font-bold">วัตถุประสงค์:</span> {booking.purpose}</div> : null}
                        </div>
                      </div>
                    </>
                  );

                  if (href) {
                    return (
                      <Link
                        key={`booking-${booking.publicId}`}
                        href={href}
                        className={`group relative block rounded-md border px-1 py-0.5 font-semibold leading-tight ${className} cursor-pointer hover:ring-2 hover:ring-teal-400`}
                        title="คลิกเพื่อดูรายละเอียดการจอง"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={`booking-${booking.publicId}`}
                      className={`group relative rounded-md border px-1 py-0.5 font-semibold leading-tight ${className} cursor-help`}
                    >
                      {content}
                    </div>
                  );
                })}

                {dayBookings.length > 3 ? (
                  <div key={`more-${year}-${monthIndex}-${day}`} className="text-[11px] font-bold leading-tight text-slate-400">
                    +{dayBookings.length - 3} รายการ
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
