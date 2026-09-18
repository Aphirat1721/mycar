import { CalendarDays, CarFront, Clock3, MapPin, UsersRound } from "lucide-react";

type MeetingItem = { id: string; title: string; room: string; startAt: string; endAt: string; attendeeCount: number; department: string; purpose: string | null; status: string; };
type VehicleItem = { id: string; destination: string; departureAt: string; returnAt: string; passengerCount: number; department: string; purpose: string; status: string; requester: string; };

function fmtTime(value: string) { return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function fmtDateTime(value: string) { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function meetingStatus(status: string) { return status === "APPROVED" ? "อนุมัติแล้ว" : "รออนุมัติ"; }
function vehicleStatus(status: string) { if (status === "APPROVED" || status === "ASSIGNED") return "อนุมัติแล้ว"; if (status === "IN_PROGRESS") return "กำลังดำเนินการ"; return "รออนุมัติ"; }

const detailPopupBase = "pointer-events-none absolute z-50 hidden w-[360px] rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.18)] group-hover:block group-focus:block";

export default function PublicHomeRequestColumns({ meetings, vehicles }: { meetings: MeetingItem[]; vehicles: VehicleItem[] }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <RequestPanel title="รายการขอใช้ห้องประชุม" subtitle="รายการของวันนี้" icon={<CalendarDays size={21} />} empty="วันนี้ไม่มีการขอใช้ห้องประชุม" count={meetings.length}>
        {meetings.map((item) => (
          <div key={item.id} tabIndex={0} className="group relative rounded-2xl border border-slate-100 bg-slate-50/70 p-4 outline-none transition hover:z-40 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus:z-40 focus:bg-white focus:shadow-lg">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700"><CalendarDays size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-slate-900">{item.title}</h3><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-slate-200">{meetingStatus(item.status)}</span></div>
                <p className="mt-1 text-sm font-semibold text-slate-700">{item.room}</p>
                <p className="mt-2 text-xs text-slate-500">{fmtTime(item.startAt)} - {fmtTime(item.endAt)} น. · {item.attendeeCount} คน</p>
              </div>
            </div>
            <DetailPopup side="right" title={item.title} accent="teal" status={meetingStatus(item.status)}>
              <DetailRow icon={<Clock3 size={16} />} text={fmtDateTime(item.startAt) + " - " + fmtTime(item.endAt) + " น."} />
              <DetailRow icon={<MapPin size={16} />} text={item.room} />
              <DetailRow icon={<UsersRound size={16} />} text={"ผู้เข้าร่วม " + item.attendeeCount + " คน · " + item.department} />
              {item.purpose ? <div className="border-t border-slate-100 pt-2"><span className="font-bold text-slate-700">วัตถุประสงค์:</span> {item.purpose}</div> : null}
            </DetailPopup>
          </div>
        ))}
      </RequestPanel>

      <RequestPanel title="รายการขอใช้รถยนต์" subtitle="รายการของวันนี้" icon={<CarFront size={21} />} empty="วันนี้ไม่มีการขอใช้รถยนต์" count={vehicles.length}>
        {vehicles.map((item) => (
          <div key={item.id} tabIndex={0} className="group relative rounded-2xl border border-slate-100 bg-slate-50/70 p-4 outline-none transition hover:z-40 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus:z-40 focus:bg-white focus:shadow-lg">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700"><CarFront size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-slate-900">{item.destination}</h3><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-slate-200">{vehicleStatus(item.status)}</span></div>
                <p className="mt-1 text-sm font-semibold text-slate-700">{fmtTime(item.departureAt)} - {fmtTime(item.returnAt)} น.</p>
                <p className="mt-2 text-xs text-slate-500">{item.passengerCount} คน · {item.department}</p>
              </div>
            </div>
            <DetailPopup side="left" title={item.destination} accent="sky" status={vehicleStatus(item.status)}>
              <DetailRow icon={<Clock3 size={16} />} text={fmtDateTime(item.departureAt) + " - " + fmtTime(item.returnAt) + " น."} />
              <DetailRow icon={<MapPin size={16} />} text={"เส้นทาง / สถานที่: " + item.destination} />
              <DetailRow icon={<UsersRound size={16} />} text={"ผู้โดยสาร " + item.passengerCount + " คน · " + item.department} />
              <div><span className="font-bold text-slate-700">ผู้ขอ:</span> {item.requester}</div>
              <div><span className="font-bold text-slate-700">วัตถุประสงค์:</span> {item.purpose}</div>
            </DetailPopup>
          </div>
        ))}
      </RequestPanel>
    </section>
  );
}

function DetailPopup({ side, title, accent, status, children }: { side: "left" | "right"; title: string; accent: "teal" | "sky"; status: string; children: React.ReactNode }) {
  const accentClass = accent === "teal" ? "text-teal-700 bg-teal-50" : "text-sky-700 bg-sky-50";
  const desktopSide = side === "right" ? "lg:left-[calc(100%+12px)]" : "lg:right-[calc(100%+12px)]";
  return (
    <div className={detailPopupBase + " left-3 right-3 top-full mt-2 w-auto translate-y-0 lg:top-1/2 lg:mt-0 lg:w-[360px] lg:-translate-y-1/2 lg:left-auto lg:right-auto " + desktopSide}>
      <div className="flex items-start gap-3">
        <div className={"grid size-9 shrink-0 place-items-center rounded-xl " + accentClass}>{accent === "teal" ? <CalendarDays size={17} /> : <CarFront size={17} />}</div>
        <div className="min-w-0 flex-1"><div className="font-black leading-5 text-slate-900">{title}</div><div className="mt-0.5 text-[11px] font-semibold text-slate-400">รายละเอียดการขอใช้วันนี้</div></div>
      </div>
      <div className="mt-4 grid gap-2.5 text-slate-600">{children}</div>
      <div className={"mt-4 rounded-xl px-3 py-2.5 text-xs font-bold " + accentClass}>สถานะ : {status}</div>
      <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-400">เข้าสู่ระบบเพื่อดูรายละเอียดทั้งหมดและดำเนินการ</div>
    </div>
  );
}

function DetailRow({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-start gap-2.5"><span className="mt-0.5 shrink-0 text-slate-400">{icon}</span><span className="leading-5">{text}</span></div>; }

function RequestPanel({ title, subtitle, icon, empty, count, children }: { title: string; subtitle: string; icon: React.ReactNode; empty: string; count: number; children: React.ReactNode }) {
  return <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
    <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">{icon}</div><div><h2 className="text-lg font-black text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{count} รายการ</span></div>
    <div className="mt-4 space-y-3">{count ? children : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-400">{empty}</div>}</div>
  </div>;
}