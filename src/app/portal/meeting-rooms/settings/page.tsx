import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { Package, DoorOpen } from "lucide-react";

export default async function MeetingSettings(){
  await requireAdmin("MEETING_ROOMS");
  return <section className="mx-auto max-w-5xl">
    <div className="mb-7"><p className="text-sm font-bold tracking-[0.14em] text-teal-700">SETTINGS</p><h1 className="mt-1 text-3xl font-black text-slate-900">ตั้งค่าระบบจองห้องประชุม</h1><p className="mt-2 text-sm text-slate-500">จัดการข้อมูลพื้นฐานห้องประชุมและอุปกรณ์</p></div>
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/portal/meeting-rooms/settings/equipment" className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Package size={24}/></span><h2 className="mt-5 text-xl font-black text-slate-900">จัดการอุปกรณ์</h2><p className="mt-2 text-sm leading-6 text-slate-500">เพิ่ม แก้ไข เปิดใช้งาน และปิดการใช้งานอุปกรณ์</p><span className="mt-5 inline-flex text-sm font-bold text-teal-700">เข้าสู่การจัดการ →</span></Link>
      <Link href="/portal/meeting-rooms/settings/rooms" className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><DoorOpen size={24}/></span><h2 className="mt-5 text-xl font-black text-slate-900">จัดการห้องประชุม</h2><p className="mt-2 text-sm leading-6 text-slate-500">เพิ่ม แก้ไข เปิด/ปิดใช้งาน รูปภาพ และรายละเอียดห้องประชุม</p><span className="mt-5 inline-flex text-sm font-bold text-teal-700">เข้าสู่การจัดการ →</span></Link>
    </div>
  </section>
}
