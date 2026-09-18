import Link from "next/link";
import { CalendarDays, ClipboardList, DoorOpen, Plus, ArrowLeft, Settings, UserCircle, ShieldCheck, ListChecks } from "lucide-react";
import { getCurrentUser } from "@/modules/identity/session";
import { hasApplicationRole, hasPermission } from "@/lib/authorization";
import { hasApplicationAccess } from "@/modules/portal/applications";
import { redirect } from "next/navigation";

export default async function MeetingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const displayName = user?.nameTh || [user?.firstnameTh, user?.lastnameTh].filter(Boolean).join(" ") || "ผู้ใช้งาน";
  const isAdmin = !!user && await hasApplicationRole(user.id, "MEETING_ROOMS");
  const canApprove = user ? isAdmin || await hasPermission(user.id, "APPROVE_MEETING_BOOKINGS", "MEETING_ROOMS") : false;
  const canReport = user ? isAdmin || await hasPermission(user.id, "VIEW_MEETING_REPORTS", "MEETING_ROOMS") : false;
  const canAccess = user ? await hasApplicationAccess(user.id, "MEETING_ROOMS") : false;
  if (user && !canAccess && !isAdmin) redirect("/portal");
  return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link href="/portal" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white"><DoorOpen size={20}/></span><span><span className="block text-sm font-black text-slate-900">ระบบจองห้องประชุม</span><span className="block text-[11px] text-slate-500">Health Portal</span></span></Link>
      <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex"><UserCircle size={18} className="text-teal-600"/><span className="max-w-48 truncate text-sm font-bold text-slate-700">{displayName}</span></div><Link href="/portal" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ArrowLeft size={17}/>กลับ Portal</Link></div>
    </div></header>
    <nav className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
      <Link href="/portal/meeting-rooms" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"><CalendarDays size={17}/>ภาพรวม</Link>
      <Link href="/portal/meeting-rooms/calendar" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"><CalendarDays size={17}/>ปฏิทิน</Link>
      <Link href="/portal/meeting-rooms/book" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"><Plus size={17}/>จองห้องประชุม</Link>
      <Link href="/portal/meeting-rooms/my-bookings" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"><ClipboardList size={17}/>รายการจองของฉัน</Link>
      {canReport ? <Link href="/portal/meeting-rooms/reports" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-bold text-blue-700 hover:bg-blue-50"><ListChecks size={17}/>รายงาน</Link> : null}
      {canApprove ? <><Link href="/portal/meeting-rooms/approval" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-teal-700 hover:bg-teal-50"><ShieldCheck size={17}/>อนุมัติการจอง</Link><Link href="/portal/meeting-rooms/status" className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-teal-700 hover:bg-teal-50"><ListChecks size={17}/>จัดการสถานะการจอง</Link></> : null}
      {isAdmin ? <Link href="/portal/meeting-rooms/settings" className="ml-auto flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"><Settings size={17}/>ตั้งค่า</Link> : null}
    </div></nav><main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main></div>;
}
