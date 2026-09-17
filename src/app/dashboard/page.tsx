import { CarFront, ShieldCheck, Users, ArrowUpRight, ClipboardPlus, MapPin, Clock3, Star } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import DashboardVehicleCalendar from "@/components/dashboard-vehicle-calendar";

export const dynamic = "force-dynamic";

const BANGKOK = "Asia/Bangkok";

function bangkokParts(date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return { year: Number(p.find(x => x.type === "year")?.value), month: Number(p.find(x => x.type === "month")?.value) - 1, day: Number(p.find(x => x.type === "day")?.value) };
}

function dateOnly(year: number, month: number, day: number) { return new Date(Date.UTC(year, month, day)); }
function dateText(value: Date | string) { return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { day: "2-digit", month: "long", year: "numeric", timeZone: BANGKOK }).format(new Date(value)); }
// departureTime/returnTime are time-only values stored with UTC as the canonical representation.
// Display them as the stored wall-clock time; applying Asia/Bangkok here would subtract 7 hours.
function timeText(value: Date | string) { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(value)); }
type RequestPerson = { requester?: { nameTh?: string | null; firstnameTh?: string | null; lastnameTh?: string | null } | null };
function displayName(item: RequestPerson) { return item?.requester?.nameTh || [item?.requester?.firstnameTh, item?.requester?.lastnameTh].filter(Boolean).join(" ") || "ไม่ระบุ"; }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const current = bangkokParts();
  let year = Number(params.year) || current.year;
  const requestedMonth = Number(params.month);
  let month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth - 1 : current.month;
  const normalized = new Date(Date.UTC(year, month, 1));
  year = normalized.getUTCFullYear();
  month = normalized.getUTCMonth();
  const todayYear = current.year, todayMonth = current.month, todayDay = current.day;
  const startOfToday = dateOnly(todayYear, todayMonth, todayDay), endOfToday = dateOnly(todayYear, todayMonth, todayDay + 1);
  const startOfMonth = dateOnly(year, month, 1), endOfMonth = dateOnly(year, month + 1, 1);
  const canApprove = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN", "VEHICLE_APPROVER"].includes(role.key));

  const [drivers, vehicles, todayRequests, monthRequests, pendingEvaluations, myPendingRequests, approvalPendingRequests] = await Promise.all([
    prisma.driver.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.vehicle.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.vehicleRequest.findMany({
      where: { departureDate: { gte: startOfToday, lt: endOfToday } },
      orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
      include: { requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { nameTh: true } }, vehicle: { select: { licensePlate: true, brand: true, model: true } }, driver: { select: { firstName: true, lastName: true, nickname: true } } },
    }),
    prisma.vehicleRequest.findMany({
      where: { departureDate: { gte: startOfMonth, lt: endOfMonth } },
      orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
      include: { requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { nameTh: true } }, vehicle: { select: { licensePlate: true, brand: true, model: true } }, driver: { select: { firstName: true, lastName: true, nickname: true } } },
    }),
    prisma.vehicleRequest.findMany({ where: { requesterId: user.id, status: "COMPLETED", driverId: { not: null }, evaluation: null }, select: { id: true } }),
    prisma.vehicleRequest.findMany({
      where: { requesterId: user.id, status: "PENDING" },
      orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
      take: 5,
      select: { publicId: true, departureDate: true, departureTime: true, returnDate: true, returnTime: true, destination: true, purpose: true, passengerCount: true },
    }),
    canApprove ? prisma.vehicleRequest.findMany({
      where: { status: "PENDING" },
      orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
      take: 8,
      select: { publicId: true, departureDate: true, departureTime: true, returnDate: true, returnTime: true, destination: true, purpose: true, passengerCount: true, requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { nameTh: true } } },
    }) : Promise.resolve([]),
  ]);

  const isAdmin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
  const name = user.nameTh ?? "บุคลากรโรงพยาบาล";
  const calendarRequests = monthRequests.map(item => ({
    id: item.publicId,
    departureDate: item.departureDate.toISOString(),
    departureTime: item.departureTime.toISOString(),
    returnDate: item.returnDate.toISOString(),
    returnTime: item.returnTime.toISOString(),
    destination: item.destination,
    purpose: item.purpose,
    passengerCount: item.passengerCount,
    requester: displayName(item),
    department: item.department?.nameTh ?? "",
    status: item.status,
    vehicle: item.vehicle ? [item.vehicle.licensePlate, item.vehicle.brand, item.vehicle.model].filter(Boolean).join(" ") : null,
    driver: item.driver ? `${item.driver.firstName} ${item.driver.lastName}` : null,
  }));

  return <div className="space-y-7">
    <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/10 sm:p-9">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-teal-300">ระบบขอใช้รถยนต์</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">สวัสดี, {name}</h1>
        <p className="mt-3 leading-7 text-slate-300">ภาพรวมการขอใช้รถยนต์ของโรงพยาบาล และสถานะรถที่พร้อมใช้งาน</p>
      </div>
      <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200"><ShieldCheck size={15} className="text-teal-300" />ยืนยันสิทธิ์หน่วยบริการ 11061 แล้ว</div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard icon={ClipboardPlus} label="คำขอใช้รถเดือนนี้" value={monthRequests.length} href="/dashboard/vehicle-requests" />
      <StatCard icon={ShieldCheck} label="คำขอใช้รถรออนุมัติ" value={canApprove ? approvalPendingRequests.length : myPendingRequests.length} href={canApprove ? "/dashboard/vehicle-requests/approval" : "/dashboard/vehicle-requests"} notify={(canApprove ? approvalPendingRequests.length : myPendingRequests.length) > 0} />
      <StatCard icon={Star} label="รอประเมิน พขร." value={pendingEvaluations.length} href={pendingEvaluations.length > 0 ? "/dashboard/vehicle-requests/evaluation" : undefined} notify={pendingEvaluations.length > 0} />
      <StatCard icon={Users} label="พนักงานขับรถที่ Active" value={drivers} href={isAdmin ? "/dashboard/drivers" : undefined} />
      <StatCard icon={CarFront} label="รถยนต์ที่ Active" value={vehicles} href={isAdmin ? "/dashboard/vehicles" : undefined} />
    </div>


    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div><h2 className="font-black text-slate-900">รายการขอใช้รถวันนี้</h2><p className="mt-1 text-xs text-slate-500">{todayRequests.length} รายการ • เรียงตามเวลาออกเดินทาง</p></div>
        <Link href="/dashboard/vehicle-requests" className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">+ ขอใช้รถ</Link>
      </div>
      <div className="divide-y divide-slate-100">{todayRequests.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">วันนี้ยังไม่มีการขอใช้รถ</div> : todayRequests.map(item => <TodayRequest key={item.publicId} item={item} />)}</div>
    </section>

    <DashboardVehicleCalendar year={year} month={month} requests={calendarRequests} />
  </div>;
}

type TodayRequestItem = RequestPerson & { publicId: string; departureTime: Date; returnTime: Date; departureDate: Date; destination: string; department?: { nameTh: string | null } | null; passengerCount: number; vehicle?: { licensePlate: string | null; brand: string | null; model: string | null } | null; status: string };
function TodayRequest({ item }: { item: TodayRequestItem }) {
  const requester = displayName(item);
  const vehicle = item.vehicle ? [item.vehicle.licensePlate, item.vehicle.brand, item.vehicle.model].filter(Boolean).join(" ") : "ยังไม่จัดรถ";
  return <div className="grid gap-3 px-5 py-4 md:grid-cols-[230px_1fr_auto] md:items-center">
    <div className="text-sm font-bold text-slate-700"><div className="flex items-center gap-2"><Clock3 size={16} className="text-teal-600" />{timeText(item.departureTime)}–{timeText(item.returnTime)} น.</div><div className="mt-1 text-xs font-medium text-slate-400">{dateText(item.departureDate)}</div></div>
    <div><div className="font-bold text-slate-800">{item.destination}</div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>{requester}</span><span>{item.department?.nameTh ?? "ไม่ระบุแผนก"}</span><span className="flex items-center gap-1"><MapPin size={12} />{item.passengerCount} คน</span><span>{vehicle}</span></div></div>
    <Status status={item.status} />
  </div>;
}

function Status({ status }: { status: string }) {
  const labels: Record<string, string> = { PENDING: "รอพิจารณา", APPROVED: "อนุมัติ", REJECTED: "ไม่อนุมัติ", CANCELLED: "ยกเลิก", COMPLETED: "เสร็จสิ้น" };
  return <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">{labels[status] ?? status}</span>;
}

function StatCard({ icon: Icon, label, value, href, notify }: { icon: typeof Users; label: string; value: number; href?: string; notify?: boolean }) {
  const content = <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={21} /></span>{notify ? <span className="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">NOTIFY</span> : href ? <ArrowUpRight size={18} className="text-slate-400" /> : null}</div><p className="mt-6 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-4xl font-black text-slate-900">{value}</p></div>;
  return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{content}</Link> : content;
}




