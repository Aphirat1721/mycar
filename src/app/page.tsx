import { ArrowRight, CalendarDays, CarFront, ClipboardList, LayoutGrid, ShieldCheck, Sparkles } from "lucide-react";
import PublicHomeRequestColumns from "@/components/public-home-request-columns";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow() {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
}

const services = [
  { Icon: CarFront, label: "งานยานพาหนะ", tone: "teal" },
  { Icon: CalendarDays, label: "ห้องประชุม", tone: "blue" },
  { Icon: ClipboardList, label: "บริการภายใน", tone: "violet" },
];

export default async function Home() {
  const today = startOfToday();
  const tomorrow = startOfTomorrow();

  const [meetings, vehicles] = await Promise.all([
    prisma.meetingBooking.findMany({
      where: {
        startAt: { lt: tomorrow },
        endAt: { gte: today },
        status: { in: ["PENDING", "APPROVED"] },
      },
      orderBy: { startAt: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        attendeeCount: true,
        purpose: true,
        status: true,
        room: { select: { nameTh: true } },
        department: { select: { nameTh: true } },
      },
    }),
    prisma.vehicleRequest.findMany({
      where: {
        departureAt: { lt: tomorrow },
        returnAt: { gte: today },
        status: { in: ["PENDING", "APPROVED", "ASSIGNED", "IN_PROGRESS"] },
      },
      orderBy: { departureAt: "asc" },
      take: 20,
      select: {
        id: true,
        destination: true,
        departureAt: true,
        returnAt: true,
        passengerCount: true,
        purpose: true,
        status: true,
        requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } },
        department: { select: { nameTh: true } },
      },
    }),
  ]);

  const meetingItems = meetings.map((item) => ({
    id: item.id,
    title: item.title,
    room: item.room.nameTh,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    attendeeCount: item.attendeeCount,
    department: item.department?.nameTh ?? "ไม่ระบุหน่วยงาน",
    purpose: item.purpose,
    status: item.status,
  }));

  const vehicleItems = vehicles.map((item) => ({
    id: item.id,
    destination: item.destination,
    departureAt: item.departureAt.toISOString(),
    returnAt: item.returnAt.toISOString(),
    passengerCount: item.passengerCount,
    department: item.department?.nameTh ?? "ไม่ระบุหน่วยงาน",
    purpose: item.purpose,
    status: item.status,
    requester:
      item.requester.nameTh ||
      [item.requester.firstnameTh, item.requester.lastnameTh].filter(Boolean).join(" ") ||
      "ไม่ระบุชื่อผู้ขอ",
  }));

  return (
    <main className="login-page min-h-screen overflow-hidden">
      <div className="hospital-backdrop" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />
      <div className="login-glow login-glow-a" aria-hidden="true" />
      <div className="login-glow login-glow-b" aria-hidden="true" />
      <div className="login-glow login-glow-c" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid min-h-[calc(100vh-4rem)] items-center gap-12 lg:grid-cols-[1fr_430px] lg:gap-20">
          <section className="hidden lg:block">
            <div className="login-brand inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/65 px-4 py-2.5 shadow-sm backdrop-blur-xl">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shadow-lg">
                <LayoutGrid size={19} />
              </span>
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-teal-700">KASETWISAI HOSPITAL</p>
                <p className="text-sm font-bold text-slate-800">Digital Services Platform</p>
              </div>
            </div>

            <div className="mt-12 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700">
                <Sparkles size={15} />
                <span>Digital Services Platform</span>
              </div>
              <h1 className="text-6xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 xl:text-7xl">
                ระบบบริการดิจิทัล
                <span className="login-title-gradient mt-2 block">สำหรับบุคลากร</span>
              </h1>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {services.map(({ Icon, label, tone }) => (
                <div key={label} className={`login-service login-service-${tone}`}>
                  <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                </div>
              ))}
              <div className="login-service login-service-more">
                <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm">
                  <LayoutGrid size={18} />
                </span>
                <span className="text-sm font-bold text-slate-500">และบริการอื่น ๆ</span>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px w-12 bg-slate-300" />
              <span>เข้าสู่ระบบครั้งเดียว เพื่อใช้งานบริการที่ได้รับสิทธิ์</span>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="login-card rounded-[2rem] p-7 sm:p-9">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
                    <LayoutGrid size={22} />
                  </span>
                  <div>
                    <p className="text-[11px] font-black tracking-[0.16em] text-teal-700">KASETWISAI HOSPITAL</p>
                    <p className="text-sm font-bold text-slate-800">Digital Services Platform</p>
                  </div>
                </div>
              </div>

              <div className="mb-7">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-teal-600">
                  <span className="login-status-dot" /> ระบบพร้อมให้บริการ
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">ยินดีต้อนรับ</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">โรงพยาบาลเกษตรวิสัย</p>
              </div>

              <a href="/mycar/api/v1/auth/provider/login" className="login-provider-button group flex min-h-16 w-full items-center gap-3 rounded-2xl px-5 text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-teal-100">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10"><ShieldCheck size={20} /></span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-extrabold">เข้าสู่ระบบด้วย Provider ID</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-white/60">ยืนยันตัวตนอย่างปลอดภัย</span>
                </span>
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={19} />
              </a>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><ShieldCheck size={17} /></span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">การเข้าใช้งานที่ปลอดภัย</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">ระบบจะตรวจสอบสิทธิ์และหน่วยบริการจากข้อมูล Provider ID โดยอัตโนมัติ</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="-mt-24 border-t border-white/70 pt-6 lg:-mt-32">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-teal-700">TODAY</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">รายการขอใช้วันนี้</h2>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
              <ShieldCheck size={15} />
              รายละเอียดทั้งหมดต้องเข้าสู่ระบบ
            </div>
          </div>
          <PublicHomeRequestColumns meetings={meetingItems} vehicles={vehicleItems} />
        </section>
      </div>
    </main>
  );
}
